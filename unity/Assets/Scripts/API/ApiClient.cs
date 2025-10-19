using UnityEngine;
using UnityEngine.Networking;
using System.Collections;

[System.Serializable] public class PetDTO { public string id; public string state; public string ownerId; }
[System.Serializable] public class CreateOrderReq { public string petId; public string action; }
[System.Serializable] public class CreateOrderRes { public string orderId; public string status; }
[System.Serializable] public class OrderDTO { public string id; public string status; public string action; public string petId; }

public class ApiClient : MonoBehaviour {
  [Header("Backend base URL (no trailing slash)")]
  public string BaseUrl = "https://my-gotchi.vercel.app/"; // <- set this

  public IEnumerator GetPet(string petId, System.Action<PetDTO> onDone) {
    using var req = UnityWebRequest.Get($"{BaseUrl}/api/pets/{petId}");
    req.SetRequestHeader("Accept", "application/json");
    yield return req.SendWebRequest();
    if (req.result != UnityWebRequest.Result.Success) { Debug.LogError(req.error); onDone?.Invoke(null); yield break; }
    var dto = JsonUtility.FromJson<PetDTO>(req.downloadHandler.text);
    onDone?.Invoke(dto);
  }

  public IEnumerator CreateOrder(string petId, string action, System.Action<CreateOrderRes> onDone) {
    var body = JsonUtility.ToJson(new CreateOrderReq { petId = petId, action = action });
    var req = new UnityWebRequest($"{BaseUrl}/api/orders", "POST");
    req.uploadHandler = new UploadHandlerRaw(System.Text.Encoding.UTF8.GetBytes(body));
    req.downloadHandler = new DownloadHandlerBuffer();
    req.SetRequestHeader("Content-Type", "application/json");
    req.SetRequestHeader("Accept", "application/json");
    yield return req.SendWebRequest();
    if (req.result != UnityWebRequest.Result.Success) { Debug.LogError(req.error); onDone?.Invoke(null); yield break; }
    var dto = JsonUtility.FromJson<CreateOrderRes>(req.downloadHandler.text);
    onDone?.Invoke(dto);
  }

  public IEnumerator GetOrder(string orderId, System.Action<OrderDTO> onDone) {
    using var req = UnityWebRequest.Get($"{BaseUrl}/api/orders/{orderId}");
    req.SetRequestHeader("Accept", "application/json");
    yield return req.SendWebRequest();
    if (req.result != UnityWebRequest.Result.Success) { Debug.LogError(req.error); onDone?.Invoke(null); yield break; }
    var dto = JsonUtility.FromJson<OrderDTO>(req.downloadHandler.text);
    onDone?.Invoke(dto);
  }

  public IEnumerator PollOrder(string orderId, float seconds, System.Action<string> onFinal) {
    float end = Time.time + seconds;
    while (Time.time < end) {
      OrderDTO o = null;
      yield return GetOrder(orderId, (x) => o = x);
      if (o != null) {
        if (o.status == "succeeded") { onFinal?.Invoke("succeeded"); yield break; }
        if (o.status == "failed" || o.status == "canceled") { onFinal?.Invoke(o.status); yield break; }
      }
      yield return new WaitForSeconds(1.0f);
    }
    onFinal?.Invoke("timeout");
  }
}
