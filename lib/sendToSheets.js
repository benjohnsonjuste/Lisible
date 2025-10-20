export async function publishToSheets(data) {
  const webhookURL = "https://script.google.com/macros/s/AKfycbyAyvh4_2ntzSZftpa77BS6Mt6YrHfkatD3X_TqfktmJakpGUwEHItLLmPN1x4-1or0/exec";
  const res = await fetch(webhookURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.text();
}