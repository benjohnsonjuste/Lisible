"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext"; // <-- pour récupérer l’utilisateur connecté
import { createOrUpdateFile, getFileContent } from "@/lib/githubClient"; // <-- ton client GitHub

export default function TextPublishingForm() {
  const router = useRouter();
  const { user } = useAuth(); // récupère l’utilisateur connecté
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
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
      // 1️⃣ — Conversion image en base64 si présente
      let imageBase64 = null;
      let imageName = null;
      if (imageFile) {
        imageBase64 = await toDataUrl(imageFile);
        imageName = imageFile.name;
      }

      // 2️⃣ — Création du texte complet
      const id = Date.now();
      const authorName =
        user?.displayName ||
        user?.email?.split("@")[0] ||
        "Auteur inconnu";

      const newText = {
        id,
        title,
        content,
        authorName,
        authorId: user?.uid || null,
        date: new Date().toISOString(),
        image: imageBase64,
      };

      // 3️⃣ — Créer le fichier individuel du texte
      await createOrUpdateFile({
        owner: "benjohnsonjuste",
        repo: "Lisible",
        path: `public/data/texts/${id}.json`,
        content: JSON.stringify(newText, null, 2),
        message: `📝 Nouveau texte: ${title}`,
      });

      // 4️⃣ — Charger l’index existant
      let indexData = [];
      try {
        const res = await getFileContent({
          owner: "benjohnsonjuste",
          repo: "Lisible",
          path: "public/data/texts/index.json",
        });
        indexData = JSON.parse(res || "[]");
      } catch {
        console.warn("Aucun index trouvé, création d’un nouveau fichier index.json");
      }

      // 5️⃣ — Ajouter le résumé du texte
      const newTextSummary = {
        id: newText.id,
        title: newText.title,
        authorName: newText.authorName,
        authorId: newText.authorId,
        date: newText.date,
        image: newText.image || null,
      };

      const updatedIndex = [newTextSummary, ...indexData];

      // 6️⃣ — Sauvegarder l’index mis à jour
      await createOrUpdateFile({
        owner: "benjohnsonjuste",
        repo: "Lisible",
        path: "public/data/texts/index.json",
        content: JSON.stringify(updatedIndex, null, 2),
        message: `📚 Index mis à jour: ${title}`,
      });

      toast.success("✅ Publication réussie !");
      setTitle("");
      setContent("");
      setImageFile(null);
      router.push("/bibliotheque");
    } catch (err) {
      console.error("Erreur de publication:", err);
      toast.error("❌ Erreur lors de la publication");
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
        {loading ? "Publication en cours..." : "Publier sur GitHub"}
      </button>
    </form>
  );
}