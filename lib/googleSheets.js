import { google } from "googleapis";
import { GOOGLE_SHEET_ID, GOOGLE_SERVICE_EMAIL, GOOGLE_PRIVATE_KEY } from "./config";

const auth = new google.auth.JWT(
  GOOGLE_SERVICE_EMAIL,
  null,
  GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  ["https://www.googleapis.com/auth/spreadsheets"]
);

const sheets = google.sheets({ version: "v4", auth });

export async function addRowToSheet({ auteur, titre, contenu, imageURL }) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: GOOGLE_SHEET_ID,
    range: "Feuille1!A:E",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[auteur, titre, contenu, imageURL, new Date().toISOString()]],
    },
  });
}

export async function getAllRows() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: GOOGLE_SHEET_ID,
    range: "Feuille1!A:E",
  });

  const rows = res.data.values || [];
  return rows.slice(1).map(([auteur, titre, contenu, imageURL, date], i) => ({
    id: i + 1,
    auteur,
    titre,
    contenu,
    imageURL,
    date,
  }));
}