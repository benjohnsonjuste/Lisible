// pages/api/sheets.js
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Méthode non autorisée");

  const { title, author, date, likes, views } = req.body;

  try {
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");
    const sheetId = process.env.GOOGLE_SHEET_ID;

    const jwt = new JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const doc = new GoogleSpreadsheet(sheetId, jwt);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];

    await sheet.addRow({ title, author, date, likes, views });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Erreur API Sheets:", error);
    res.status(500).json({ error: "Échec de l’envoi à Google Sheets" });
  }
}