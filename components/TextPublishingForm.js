"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createOrUpdateFile, getFileContent } from "@/lib/githubClient";
import { useAuth } from "@/context/AuthContext"; // 🔥 ton AuthProvider Firebase

export default function TextPublishingForm() {
  const router = useRouter();
  const { user } = useAuth(); // ✅ utilisateur connecté Firebase

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🧠 Pour créer un ID unique basé sur la date
  const generateId = () => Date.now();

  // 📤 Gestion de la publication
  const handlePublish = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("⚠️ Vous devez être connecté pour publier un texte.");
      router.push("/login");
      return;
    }

    if (!title.trim() || !content.trim()) {
      toast.error("Veuillez remplir le titre et le contenu.");
      return;
    }

    setLoading(true);

    try {
      const id = generateId();
      const authorName =
        user.displayName ||
        user.email?.split("@")[0] ||
        "Auteur inconnu";

      const authorId = user.uid || null;

      const newText = {
        id,
        title,
        content,
        authorName,
        authorId,
        date: new Date().toISOString(),
        image: image || "/default-placeholder.png",
      };

      // 1️⃣ — Créer le fichier du texte individuel
      await createOrUpdateFile({
        owner: "benjohnsonjuste",
        repo: "Lisible",
        path: `public/data/texts/${id}.json`,
        content: JSON.stringify(newText, null, 2),
        message: `📝 Nouveau texte: ${title}`,
      });

      // 2️⃣ — Mettre à jour l’index général
      let indexData = [];
      try {
        const res = await getFileContent({
          owner: "benjohnsonjuste",
          repo: "Lisible",
          path: "public/data/texts/index.json",
        });
        indexData = JSON.parse(res || "[]");
      } catch (err) {
        console.warn("⚠️ Aucun index trouvé, création d’un nouveau.");
      }

      const newEntry = {
        id,
        title,
        authorName,
        authorId,
        date: newText.date,
        image: newText.image,
      };

      const updatedIndex = [newEntry, ...indexData];
      await createOrUpdateFile({
        owner: "benjohnsonjuste",
        repo: "Lisible",
        path: "public/data/texts/index.json",
        content: JSON.stringify(updatedIndex, null, 2),
        message: `📚 Index mis à jour: ${title}`,
      });

      toast.success("✅ Texte publié avec succès !");
      router.push(`/texts/${id}`);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la publication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handlePublish}
      className="max-w-3xl mx-auto bg-white shadow rounded-xl p-6 space-y-4"
    >
      <h1 className="text-2xl font-semibold text-center mb-4">
        ✍️ Publier un texte
      </h1>

      <input
        type="text"
        placeholder="Titre du texte"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-2 border rounded"
      />

      <textarea
        placeholder="Contenu du texte..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={10}
        className="w-full p-2 border rounded"
      />

      <div>
        <label className="text-sm text-gray-600 mb-1 block">Image (facultative)</label>
        {image && (
          <img
            src={image}
            alt="aperçu"
            className="w-full h-48 object-cover mb-2 rounded"
          />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => setImage(reader.result);
            if (file) reader.readAsDataURL(file);
          }}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
      >
        {loading ? "Publication en cours..." : "Publier"}
      </button>
    </form>
  );
}