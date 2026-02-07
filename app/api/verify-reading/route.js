// app/api/verify-reading/route.js
import { Octokit } from "@octokit/rest";
import { Buffer } from "buffer";

export async function POST(req) {
  try {
    const body = await req.json();
    const { fileName } = body; // ex: "mon-manuscrit.json"

    if (!fileName) {
      return new Response(JSON.stringify({ error: "Fichier requis" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const owner = "benjohnsonjuste";
    const repo = "Lisible";
    const path = `data/publications/${fileName}`;

    // 1. Récupérer le contenu actuel
    let fileData;
    try {
      const response = await octokit.repos.getContent({ owner, repo, path });
      fileData = response.data;
    } catch (e) {
      return new Response(JSON.stringify({ error: "Publication introuvable" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const content = JSON.parse(Buffer.from(fileData.content, "base64").toString("utf-8"));

    // 2. Incrémenter la lecture certifiée
    content.certifiedReads = (Number(content.certifiedReads) || 0) + 1;

    // 3. Renvoyer sur GitHub (Commit)
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `📈 Certification de lecture : ${fileName}`,
      content: Buffer.from(JSON.stringify(content, null, 2)).toString("base64"),
      sha: fileData.sha,
    });

    return new Response(
      JSON.stringify({ success: true, count: content.certifiedReads }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Verification Error:", error);
    return new Response(JSON.stringify({ error: "Erreur lors de la certification" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
