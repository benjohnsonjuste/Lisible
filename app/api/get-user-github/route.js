import { Octokit } from "@octokit/rest";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email manquant" }, { status: 400 });
  }

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const fileName = Buffer.from(email.toLowerCase().trim()).toString("base64").replace(/=/g, "");
  const path = `data/users/${fileName}.json`;

  try {
    const { data: fileData } = await octokit.repos.getContent({
      owner: "benjohnsonjuste",
      repo: "Lisible",
      path,
    });

    const content = Buffer.from(fileData.content, "base64").toString("utf-8");
    const userData = JSON.parse(content);

    // Sécurité : Ne jamais renvoyer le mot de passe
    const { password, ...safeUser } = userData;
    
    return NextResponse.json(safeUser, { status: 200 });
  } catch (err) {
    if (err.status === 404) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }
    return NextResponse.json({ error: "Erreur serveur GitHub" }, { status: 500 });
  }
}
