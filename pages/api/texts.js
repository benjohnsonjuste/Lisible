import { Buffer } from "buffer";
import DOMPurify from "isomorphic-dompurify";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req, res) {
  /* ==============================
     CORS — OBLIGATOIRE ET COMPLET
  ============================== */
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const token = process.env.GITHUB_TOKEN;
  const owner = "benjohnsonjuste";
  const repo = "Lisible";

  if (!token) {
    return res.status(500).json({ error: "GITHUB_TOKEN manquant" });
  }

  /* ==============================
     GET (placeholder)
  ============================== */
  if (req.method === "GET") {
    return res.status(200).json({ ok: true });
  }

  /* ==============================
     POST — PUBLICATION
  ============================== */
  if (req.method === "POST") {
    try {
      const textData = req.body;

      if (!textData || !textData.content) {
        return res.status(400).json({
          error: "Le contenu du manuscrit est requis.",
        });
      }

      /* ---------- Sanitation ---------- */
      const cleanTitle = DOMPurify.sanitize(
        textData.title || "Sans titre",
        { ALLOWED_TAGS: [] }
      ).trim();

      const cleanContent = DOMPurify.sanitize(
        textData.content || ""
      );

      /* ---------- Slug ---------- */
      const slug =
        cleanTitle
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
          .slice(0, 30) || "manuscrit";

      const id = `${slug}-${Date.now()}`;
      const creationDate = new Date().toISOString();

      const securedData = {
        ...textData,
        id,
        title: cleanTitle,
        content: cleanContent,
        date: creationDate,
        views: 0,
        totalLikes: 0,
        totalCertified: 0,
        comments: [],
        category: textData.category || "Littérature",
        imageBase64: textData.imageBase64 || null,
      };

      /* ---------- 1. Sauvegarde texte ---------- */
      const textPath = `data/texts/${id}.json`;

      const fileResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${textPath}`,
        {
          method: "PUT",
          headers: {
            Authorization: `token ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: `📖 Publication : ${cleanTitle}`,
            content: Buffer.from(
              JSON.stringify(securedData),
              "utf-8"
            ).toString("base64"),
          }),
        }
      );

      if (!fileResponse.ok) {
        const err = await fileResponse.text();
        console.error("GitHub file error:", err);
        throw new Error("Échec de la sauvegarde du texte.");
      }

      /* ---------- 2. Mise à jour index ---------- */
      const indexUrl =
        `https://api.github.com/repos/${owner}/${repo}` +
        `/contents/data/publications/index.json`;

      let indexContent = [];
      let indexSha = null;

      const indexFetch = await fetch(`${indexUrl}?t=${Date.now()}`, {
        headers: { Authorization: `token ${token}` },
      });

      if (indexFetch.ok) {
        const indexRes = await indexFetch.json();
        indexSha = indexRes.sha;
        indexContent = JSON.parse(
          Buffer.from(indexRes.content, "base64").toString("utf-8")
        );
      }

      indexContent.unshift({
        id,
        title: cleanTitle,
        authorName: textData.authorName || "Plume",
        authorEmail: textData.authorEmail?.toLowerCase().trim(),
        date: creationDate,
        genre: securedData.category,
        excerpt: cleanContent.slice(0, 200),
        hasImage: Boolean(textData.imageBase64),
      });

      const updateRes = await fetch(indexUrl, {
        method: "PUT",
        headers: {
          Authorization: `token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "🗂 Mise à jour index",
          content: Buffer.from(
            JSON.stringify(indexContent.slice(0, 1000)),
            "utf-8"
          ).toString("base64"),
          sha: indexSha,
        }),
      });

      if (!updateRes.ok) {
        const err = await updateRes.text();
        console.error("GitHub index error:", err);
        throw new Error("Échec mise à jour index.");
      }

      return res.status(201).json({ success: true, id });

    } catch (error) {
      console.error("POST /api/texts:", error);
      return res.status(500).json({
        error: error.message || "Erreur serveur",
      });
    }
  }

  return res.status(405).json({
    error: `Méthode ${req.method} non autorisée`,
  });
}