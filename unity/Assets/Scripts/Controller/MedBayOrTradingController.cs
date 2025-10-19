// MedBayOrTradingController.cs
using System.Collections;
using UnityEngine;

public class MedBayOrTradingController : MonoBehaviour {
  public ApiClient api;           // has BackendConfig injected
  public string petId;

  public void OnHeal()   { StartCoroutine(StartPayment("heal")); }
  public void OnRevive() { StartCoroutine(StartPayment("revive")); }
  public void OnBuy()    { StartCoroutine(StartPayment("buy")); }

  private IEnumerator StartPayment(string action) {
    // 1) create order (status=pending)
    CreateOrderRes res = null;
    yield return api.CreateOrder(petId, action, x => res = x);
    if (res == null) yield break;

    // 2) open HCO payment page (returns auto-submit html)
    string launchUrl = $"{api.config.BaseUrl}/api/payments/launch?orderId={res.orderId}";

    // --- UniWebView boilerplate ---
    var go = new GameObject("PaymentWebView");
    var webView = go.AddComponent<UniWebView>();
    webView.Frame = new Rect(0, 0, Screen.width, Screen.height);
    webView.SetShowToolbar(true); // optional
    webView.OnPageErrorReceived += (_, code, msg) => Debug.LogError($"WebView error {code}: {msg}");
    webView.Load(launchUrl);
    webView.Show();
    // -------------------------------

    // 3) poll backend while user pays (webhook updates DB)
    string final = null;
    yield return StartCoroutine(api.PollOrder(res.orderId, 120f, s => final = s));

    // 4) close webview and react
    webView.Hide();
    Destroy(go);

    if (final == "succeeded") {
      // refresh pet state and update UI
      yield return api.GetPet(petId, pet => {
        if (pet != null) UpdateUIWithState(pet.state);
      });
    } else if (final == "timeout") {
      ShowToast("Payment took too long. If you finished paying, it may update shortly.");
    } else {
      ShowToast("Payment canceled or failed.");
    }
  }

  private void UpdateUIWithState(string state) {
    // TODO: drive your scene visuals: healthy/sick/dying
  }
  private void ShowToast(string msg) {
    Debug.Log(msg); // plug in your own UI
  }
}
