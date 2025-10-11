import { google } from "googleapis";

// 🔹 Config Google Sheets
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = "texts"; // Nom de l'onglet

// Authentification via clé de service
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export default async function handler(req, res) {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    if (req.method === "GET") {
      // Lire toutes les lignes
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:G`, // colonnes : title, subtitle, content, cover_url, tags, name, likes, views
      });

      const rows = response.data.values || [];
      const headers = rows.shift(); // récupérer l'entête
      const data = rows.map((row) =>
        headers.reduce((acc, key, idx) => {
          acc[key] = row[idx] || "";
          return acc;
        }, {})
      );

      return res.status(200).json(data);
    }

    if (req.method === "POST") {
      const { rowIndex, field } = req.body;
      if (rowIndex === undefined || !field) {
        return res.status(400).json({ error: "rowIndex et field requis" });
      }

      // Lire la valeur actuelle
      const getResp = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!${field}${parseInt(rowIndex) + 2}`, // +2 car entête
      });
      let current = parseInt(getResp.data.values?.[0]?.[0] || 0);
      current += 1;

      // Écrire la nouvelle valeur
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!${field}${parseInt(rowIndex) + 2}`,
        valueInputOption: "RAW",
        requestBody: { values: [[current]] },
      });

      return res.status(200).json({ success: true, newValue: current });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}