// components/TextPublishingForm.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function TextPublishingForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [genre, setGenre] = useState("");
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
    if (!title || !content || !genre) {
      toast.error("Le titre, le contenu et le genre sont requis.");
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

      const payload = {
        title,
        content,
        genre,
        authorName: "Auteur inconnu", // ou user.displayName si Auth disponible
        authorEmail: "",
        imageBase64,
        imageName,
      };

      const res = await fetch("/api/publish-github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        console.error("Erreur publication GitHub:", json);
        throw new Error(json.error || "Échec publication");
      }

      toast.success("✅ Publication réussie !");
      setTitle("");
      setContent("");
      setGenre("");
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
      <h2 className="text-xl font-semibold text-center">Publier un texte</h2>

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
          name="genre"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="w-full p-2 border rounded"
          required
        >
          <option value="">Sélectionner un genre</option>
          <option value="Poésie">Poésie</option>
          <option value="Nouvelle">Nouvelle</option>
          <option value="Roman">Roman</option>
          <option value="Article">Article</option>
          <option value="Essai">Essai</option>
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