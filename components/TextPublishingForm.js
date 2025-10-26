// components/TextPublishingForm.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createOrUpdateFile } from "@/lib/githubClient"; // <-- notre système GitHub

export default function TextPublishingForm({ user }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [genre, setGenre] = useState("Poésie");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Convertir fichier image en Base64
  const toDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content) {
      toast.error("Le titre et le contenu sont requis.");
      return;
    }

    setLoading(true);
    try {
      let imageBase64 = null;
      let imageName = null;

      if (imageFile) {
        imageBase64 = await toDataUrl(imageFile);
        imageName = imageFile.name;
      }

      const id = Date.now().toString(); // ID unique pour chaque texte
      const payload = {
        id,
        title,
        content,
        genre,
        authorName: user?.displayName || user?.email || "Auteur inconnu",
        authorEmail: user?.email || "",
        imageBase64,
        imageName,
      };

      // Créer ou mettre à jour le texte sur GitHub
      await createOrUpdateFile({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: `data/texts/${id}.json`,
        content: JSON.stringify(payload, null, 2),
        commitMessage: `📝 Publication du texte: ${title}`,
        token: process.env.GITHUB_TOKEN,
      });

      // Mettre à jour index.json
      const indexRes = await fetch("/api/update-index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!indexRes.ok) throw new Error("Impossible de mettre à jour l'index");

      toast.success("✅ Publication réussie !");
      setTitle("");
      setContent("");
      setGenre("Poésie");
      setImageFile(null);
      router.push("/bibliotheque");
    } catch (err) {
      console.error("Erreur côté client:", err);
      toast.error("❌ Erreur de publication");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow space-y-4"
    >
      <h2 className="text-xl font-semibold text-center">📝 Publier un texte</h2>

      <div>
        <label className="block text-sm font-medium mb-1">Titre</label>
        <input
          type="text"
          name="title"
          placeholder="Titre du texte"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Contenu</label>
        <textarea
          name="content"
          placeholder="Écris ton texte ici..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          className="w-full p-2 border rounded min-h-[150px]"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Genre</label>
        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option>Poésie</option>
          <option>Nouvelle</option>
          <option>Roman</option>
          <option>Article</option>
          <option>Essai</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Image d'illustration (optionnel)
        </label>
        <input
          type="file"
          name="image"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files[0])}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        {loading ? "Publication en cours..." : "Publier sur Lisible"}
      </button>
    </form>
  );
}