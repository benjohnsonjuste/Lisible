"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUserProfile } from "@/hooks/useUserProfile";

export default function TextPublishingForm() {
  const router = useRouter();
  const { user, isLoading } = useUserProfile();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Convertir le fichier image en Base64
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
      toast.error("Le titre et le contenu sont requis.");
      return;
    }

    if (!user) {
      toast.error("Connectez-vous pour publier.");
      return;
    }

    setLoading(true);
    try {
      let imageBase64 = null;
      let imageName = null;

      if (imageFile) {
        if (!imageFile.type.startsWith("image/")) {
          toast.error("Le fichier doit être une image.");
          setLoading(false);
          return;
        }
        imageBase64 = await toDataUrl(imageFile);
        imageName = imageFile.name;
      }

      // Nom complet depuis useUserProfile
      const authorName =
        user?.fullName || user?.displayName || user?.name || "Auteur inconnu";

      const payload = {
        title: title.trim(),
        content: content.trim(),
        authorName,
        authorEmail: user?.email || "",
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

      toast.success("Publication réussie !");
      setTitle("");
      setContent("");
      setImageFile(null);
      router.push("/bibliotheque");
    } catch (err) {
      console.error("Erreur côté client:", err);
      toast.error("Erreur de publication");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return <p className="text-center mt-10">Chargement...</p>;

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
          rows={12}
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
          onChange={(e) => setImageFile(e.target.files[0] || null)}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        {loading ? "Publication en cours..." : "Publier"}
      </button>
    </form>
  );
}