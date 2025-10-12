// /lib/sendToSheets.js

/**
 * Envoie les données vers l’API Google Sheets via /api/sheets
 * @param {Object} data - Les données à enregistrer dans Google Sheets
 * @returns {Promise<Object>} - La réponse JSON de l’API
 */
export async function sendToSheets(data) {
  try {
    // Appel à ton endpoint API interne
    const response = await fetch("/api/sheets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    // Si l’API renvoie une erreur
    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(`Erreur API Sheets : ${errorMessage}`);
    }

    // Retourner la réponse JSON
    const result = await response.json();
    console.log("✅ Données envoyées à Google Sheets :", result);
    return result;

  } catch (error) {
    console.error("❌ Erreur lors de l’envoi à Google Sheets :", error);
    throw error;
  }
}