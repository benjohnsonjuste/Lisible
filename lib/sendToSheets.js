// lib/sendToSheets.js

/**
 * Envoie des données vers ton Google Sheet via Apps Script.
 * 
 * ⚙️ Étapes préalables :
 *  - Crée un script Apps Script lié à ton Google Sheet (voir tutoriel précédent)
 *  - Déploie-le en tant qu'API web publique
 *  - Copie ton URL Apps Script ci-dessous
 */

const GOOGLE_SHEETS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyAyvh4_2ntzSZftpa77BS6Mt6YrHfkatD3X_TqfktmJakpGUwEHItLLmPN1x4-1or0/exec"; // 🔁 Remplace par ton URL Apps Script
const SECRET_CODE = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_SECRET || "MON_SECRET_OPTIONNEL";

/**
 * Fonction d'envoi vers Google Sheets
 * @param {Object} data - Les données à envoyer (ex: {id, nom, email, texte})
 * @returns {Promise<Object>} - Réponse du serveur Apps Script
 */
export async function sendToGoogleSheets(data) {
  try {
    const payload = {
      ...data,
      secret: SECRET_CODE, // facultatif : pour sécuriser ton API
    };

    const response = await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ Données envoyées à Google Sheets :", result);
    return result;
  } catch (error) {
    console.error("❌ Erreur lors de l’envoi vers Google Sheets :", error);
    return { status: "error", message: error.message };
  }
}