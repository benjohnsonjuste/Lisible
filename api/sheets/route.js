import { google } from "googleapis";

export async function POST(req) {
  try {
    const body = await req.json();

    // 🔐 Variables d’environnement stockées dans ton fichier .env.local
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    // 🔧 Authentification avec le service account
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // 🔸 Données à insérer dans la feuille Google Sheets
    const row = [
      body.title || "",
      body.type || "",
      body.author || "",
      body.date || new Date().toISOString(),
      body.imageUrl || "",
      body.excerpt || "",
    ];

    // 🔹 Ajout de la ligne dans la feuille
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Feuille1!A:F", // Change le nom si ta feuille s'appelle autrement
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });

    return new Response(
      JSON.stringify({ success: true, message: "Texte ajouté à Google Sheets" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur API Sheets:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
