// lib/sendToSheets.js

export async function sendToSheets(data) {
  try {
    const response = await fetch("/api/sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Échec de l’envoi à Google Sheets : ${response.statusText}`);
    }

    console.log("✅ Données envoyées à Google Sheets avec succès !");
  } catch (error) {
    console.error("❌ Erreur sendToSheets:", error);
  }
}