// /pages/api/sheets.js
import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Méthode non autorisée");

  const { title, authorName, excerpt, imageUrl } = req.body;

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Feuille1!A:D",
      valueInputOption: "RAW",
      requestBody: {
        values: [[title, authorName, excerpt, imageUrl || ""]],
      },
    });

    res.status(200).json({ message: "Succès" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur API Sheets", error });
  }
}