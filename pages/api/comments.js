import { db, collection, addDoc } from "firebase/firestore";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { textId } = req.query;
    if (!textId) return res.status(400).json({ error: "textId manquant" });

    try {
      const comments = JSON.parse(localStorage.getItem(`comments-${textId}`) || "[]");
      res.status(200).json({ comments });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "POST") {
    const { textId, author, content } = req.body;
    if (!textId || !author || !content) return res.status(400).json({ error: "Paramètres manquants" });

    try {
      const newComment = { author, content, date: new Date().toISOString() };
      const key = `comments-${textId}`;
      let comments = JSON.parse(localStorage.getItem(key) || "[]");
      comments.push(newComment);
      localStorage.setItem(key, JSON.stringify(comments));

      res.status(200).json({ comment: newComment });
    } catch (error) {
      console.error("Erreur comments API:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}