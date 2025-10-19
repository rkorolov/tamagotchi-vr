using System.Collections;
using UnityEngine;
using UnityEngine.UI; // REQUIRED for Text component

public class MedBayOrTradingController : MonoBehaviour {
  
  // Dependencies injected via Unity Inspector
  public ApiClient api;           
  
  [Tooltip("The ID of the pet currently in focus for actions (Heal/Revive).")]
  public string petId; 
  
  [Tooltip("The ID of the listing, only required if the action is 'buy'.")]
  public int listingId = -1; // Use -1 as a sentinel value for "not set"

  // --- UI/Visual Dependencies ---
  [Header("Visual Dependencies")]
  [Tooltip("The Renderer or Mesh component of the Pet model.")]
  public Renderer PetRenderer; 
  // RENAMED TO MATCH SPECIFIC MATERIAL NAME
  [Tooltip("The Material to use when the pet is healthy (Tamagotchi_Mat_Healthy).")]
  public Material TamagotchiHealthyMaterial; 
  [Tooltip("The Material to use when the pet is sick.")]
  public Material SickMaterial;
  [Tooltip("The Material to use when the pet is dead.")]
  public Material DeadMaterial;
  [Tooltip("The GameObject representing the death/revive menu screen.")]
  public GameObject DeathScreen;

  // --- TOAST DEPENDENCIES (NEW) ---
  [Header("Toast Notification")]
  [Tooltip("The Text component that displays the toast message.")]
  public Text ToastText; // Use TextMeshProUGUI if you are using TextMeshPro
  [Tooltip("The duration (seconds) the toast stays visible.")]
  public float ToastDuration = 3.0f; 
  [Tooltip("Color for success/positive messages (e.g., green).")]
  public Color SuccessColor = Color.green;
  [Tooltip("Color for error/failure messages (e.g., red).")]
  public Color ErrorColor = Color.red;
  
  // DTO from ApiClient.cs for response clarity
  [System.Serializable]
  public class CreateOrderRes {
      public string orderId;
      public string checkoutUrl;
      public int priceCents;
      public string error;
  }

  // --- Public Methods (Attached to UI Buttons) ---
  
  public void OnHeal()   { StartCoroutine(StartPayment("heal")); }
  public void OnRevive() { StartCoroutine(StartPayment("revive")); }
  public void OnBuy()    
  { 
      // CRITICAL: Ensure listingId is set before initiating a purchase
      if (listingId == -1) 
      {
          ShowToast("Error: Listing ID must be set for 'buy' action.");
          return;
      }
      StartCoroutine(StartPayment("buy")); 
  } 

  // --- Core Payment Flow Coroutine ---

  private IEnumerator StartPayment(string action) {
    // 1) Create pending order in the backend
    CreateOrderRes res = null;
    
    // Pass petId for heal/revive, and listingId for buy. 
    // NOTE: This assumes ApiClient.CreateOrder now accepts listingId as an argument.
    yield return api.CreateOrder(petId, action, listingId, x => res = x); 
    
    // Handle API errors (authentication, validation, or network failure)
    if (res == null || !string.IsNullOrEmpty(res.error))
    {
        // Check for error in the response body or a general null response
        ShowToast($"Failed to start order: {res?.error ?? "Unknown API Error"}"); 
        yield break;
    }

    // 2) Open the secure payment page URL returned by the API
    string launchUrl = res.checkoutUrl; 

    // --- UniWebView boilerplate ---
    var go = new GameObject("PaymentWebView");
    var webView = go.AddComponent<UniWebView>();
    webView.Frame = new Rect(0, 0, Screen.width, Screen.height); 
    webView.SetShowToolbar(true); 
    webView.OnPageErrorReceived += (_, code, msg) => Debug.LogError($"WebView error {code}: {msg}");
    
    Debug.Log($"Opening payment launch URL: {launchUrl}");
    webView.Load(launchUrl);
    webView.Show();
    // -------------------------------

    // 3) Poll backend while user pays (Webhook updates DB)
    // We poll for up to 120 seconds for the order status to change from 'pending'.
    string final = null;
    yield return StartCoroutine(api.PollOrder(res.orderId, 120f, s => final = s));

    // 4) Close webview and react to the result
    webView.Hide();
    Destroy(go);

    if (final == "succeeded") {
      ShowToast("Payment successful! Updating pet state...");
      // Refresh pet state and update UI
      yield return api.GetPet(petId, pet => {
        if (pet != null) UpdateUIWithState(pet.state);
      });
    } else if (final == "timeout") {
      ShowToast("Payment confirmation took too long. Check your inventory shortly.");
    } else {
      // Includes 'failed' or any other non-success status
      ShowToast("Payment canceled or failed.");
    }
  }

  // --- IMPLEMENTATION FOR UI UPDATE ---
  private void UpdateUIWithState(string state) {
    Debug.Log($"Pet state updated to: {state}"); 
    
    if (PetRenderer == null) 
    {
        Debug.LogError("PetRenderer not assigned in the Inspector. Cannot update visual state.");
        return;
    }

    // Use a switch statement to drive visual changes based on the state string
    switch (state.ToLower()) 
    {
        case "healthy":
            // ASSIGNMENT TO YOUR SPECIFIC MATERIAL
            PetRenderer.material = TamagotchiHealthyMaterial; 
            if (DeathScreen != null) DeathScreen.SetActive(false);
            ShowToast("Your pet is now healthy!");
            break;

        case "sick":
            // ASSIGNMENT TO SICK MATERIAL
            PetRenderer.material = SickMaterial;
            if (DeathScreen != null) DeathScreen.SetActive(false);
            ShowToast("Oh no, your pet is sick! Heal it fast.");
            break;

        case "dead":
            // ASSIGNMENT TO DEAD MATERIAL
            PetRenderer.material = DeadMaterial;
            // Show the death menu/revive buttons
            if (DeathScreen != null) DeathScreen.SetActive(true);
            ShowToast("Your pet has died. Use a revive potion.");
            break;

        default:
            Debug.LogWarning($"Received unknown pet state: {state}");
            break;
    }
  }
  
  // --- UPDATED SHOW TOAST IMPLEMENTATION ---
  private void ShowToast(string msg) {
    if (ToastText == null)
    {
        Debug.Log($"TOAST (No UI assigned): {msg}");
        return; // Fallback to console if no UI is linked
    }

    // 1. Set Color for better interaction
    // Determine if the message is an error/failure or a success/neutral message
    string lowerMsg = msg.ToLower();
    if (lowerMsg.Contains("error") || lowerMsg.Contains("fail") || lowerMsg.Contains("canceled") || lowerMsg.Contains("died"))
    {
        ToastText.color = ErrorColor;
    }
    else if (lowerMsg.Contains("successful") || lowerMsg.Contains("healthy") || lowerMsg.Contains("revived"))
    {
        ToastText.color = SuccessColor;
    }
    else
    {
        // Default color (e.g., White or Grey) for general messages
        ToastText.color = Color.white;
    }
    
    // Stop any existing toast coroutine to prevent overlap
    StopCoroutine("FadeToast"); 

    // Set the message and start the toast display routine
    ToastText.text = msg;
    ToastText.gameObject.SetActive(true); // Make sure the parent GameObject is active
    
    // Start the routine that waits and then hides the toast
    StartCoroutine(FadeToast(ToastDuration));
  }

  private IEnumerator FadeToast(float duration) {
    // Wait for the specified duration
    yield return new WaitForSeconds(duration); 
    
    // Hide the toast UI element
    ToastText.gameObject.SetActive(false);
  }
}
