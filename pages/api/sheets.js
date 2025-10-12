// /pages/api/sheets.js

import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { GOOGLE_PRIVATE_KEY, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SHEET_ID } = process.env;

    if (!GOOGLE_PRIVATE_KEY || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_SHEET_ID) {
      throw new Error("Variables d’environnement Google manquantes !");
    }

    const auth = new google.auth.JWT(
      GOOGLE_SERVICE_ACCOUNT_EMAIL,
      null,
      GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      ["https://www.googleapis.com/auth/spreadsheets"]
    );

    const sheets = google.sheets({ version: "v4", auth });

    const { title, subtitle, content, date, visibility, likes, views } = req.body;

    await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: "Feuille1!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[title, subtitle, content, date, visibility, likes, views]],
      },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Erreur API Sheets :", error);
    return res.status(500).json({ error: error.message });
  }
}