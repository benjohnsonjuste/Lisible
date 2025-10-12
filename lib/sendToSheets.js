// /lib/sendToSheets.js

export async function sendToSheets(data) {
  try {
    const res = await fetch("/api/sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Erreur API Sheets: ${errorText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Erreur lors de l’envoi à Google Sheets :", error);
    throw error;
  }
}