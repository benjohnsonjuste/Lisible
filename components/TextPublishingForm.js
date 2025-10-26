"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createOrUpdateFile } from "@/lib/githubClient";

export default function TextPublishingForm({ user }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Convertir une image en base64
  const toDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Titre et contenu requis");
      return;
    }

    setLoading(true);
    try {
      // 1️⃣ Création des données du texte
      const id = Date.now().toString();
      let imageUrl = null;
      let imageFileName = null;

      // 2️⃣ Si une image est fournie
      if (imageFile) {
        const imageBase64 = await toDataUrl(imageFile);
        imageFileName = `${id}-${imageFile.name.replace(/\s+/g, "_")}`;

        // Sauvegarder l’image sur GitHub
        await createOrUpdateFile({
          path: `public/data/images/${imageFileName}`,
          content: imageBase64.split(",")[1], // on garde seulement la partie base64
          message: `🖼️ Ajout de l’image d’illustration pour ${title}`,
        });

        imageUrl = `/data/images/${imageFileName}`;
      }

      // 3️⃣ Créer le fichier JSON du texte
      const textData = {
        id,
        title,
        content,
        authorName: user?.name || "Auteur inconnu",
        authorId: user?.id || null,
        createdAt: new Date().toISOString(),
        imageUrl,
      };

      await createOrUpdateFile({
        path: `public/data/texts/${id}.json`,
        content: JSON.stringify(textData, null, 2),
        message: `📝 Publication du texte: ${title}`,
      });

      // 4️⃣ Mettre à jour l’index global
      const indexRes = await fetch("/api/update-index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(textData),
      });

      if (!indexRes.ok) throw new Error("Impossible de mettre à jour l’index");

      toast.success("✅ Publication réussie !");
      setTitle("");
      setContent("");
      setImageFile(null);
      router.push("/bibliotheque");
    } catch (err) {
      console.error("Erreur de publication :", err);
      toast.error("❌ Échec de publication");
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
          placeholder="Écris ton texte ici..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Image d'illustration (optionnel)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files[0])}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {loading ? "Publication en cours..." : "Publier sur Lisible"}
      </button>
    </form>
  );
}