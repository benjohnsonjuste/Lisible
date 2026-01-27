import { Buffer } from "buffer";

export default async function handler(req, res) {
  const token = process.env.GITHUB_TOKEN;
  const owner = "benjohnsonjuste";
  const repo = "Lisible";
  const branch = "main";

  // --- CRÉATION D'UN TEXTE (Appelé par la page Publish) ---
  if (req.method === "POST") {
    const { title, content, authorName, authorEmail, imageBase64, date } = req.body;
    const timestamp = Date.now();
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const fileName = `${timestamp}-${slug}`;
    const path = `data/publications/${fileName}.json`;

    const textData = { id: fileName, title, content, authorName, authorEmail, date, imageBase64, views: 0, likes: [], comments: [] };

    try {
      await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          message: `📚 Nouveau texte : ${title}`,
          content: Buffer.from(JSON.stringify(textData, null, 2)).toString("base64"),
          branch
        }),
      });
      return res.status(201).json({ id: fileName });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  // --- MODIFICATION (Vues, Likes, Commentaires) ---
  if (req.method === "PATCH") {
    const { id, action, payload } = req.body;
    const path = `data/publications/${id}.json`;

    try {
      const getFile = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      const fileInfo = await getFile.json();
      let data = JSON.parse(Buffer.from(fileInfo.content, "base64").toString());

      if (action === "view") data.views = (data.views || 0) + 1;
      if (action === "like") {
        data.likes = data.likes.includes(payload.email) 
          ? data.likes.filter(e => e !== payload.email) 
          : [...data.likes, payload.email];
      }
      if (action === "comment") {
        data.comments.push({ userName: payload.userName, text: payload.text, date: new Date().toISOString() });
      }

      await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          message: `✨ interaction : ${action}`,
          content: Buffer.from(JSON.stringify(data, null, 2)).toString("base64"),
          sha: fileInfo.sha,
          branch
        }),
      });
      return res.status(200).json(data);
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }
}
