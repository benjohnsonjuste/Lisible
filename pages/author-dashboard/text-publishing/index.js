"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function TextPublishingPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [authorName, setAuthorName] = useState("AuteurTest");
  const [authorEmail, setAuthorEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // Convertit un fichier en base64
  const toDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Erreur lecture fichier"));
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      return toast.error("Titre et contenu requis");
    }

    setLoading(true);

    try {
      let imageBase64 = null;
      let imageName = null;
      if (imageFile) {
        imageBase64 = await toDataUrl(imageFile);
        imageName = imageFile.name;
      }

      const res = await fetch("/api/publish-github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          authorName,
          authorEmail,
          imageBase64,
          imageName,
          createdAt: new Date().toISOString(),
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || JSON.stringify(data));

      toast.success("Publié avec succès !");
      // Redirection vers le post GitHub
      window.open(data.url, "_blank");
      // Optionnel : reset form
      setTitle("");
      setContent("");
      setImageFile(null);
    } catch (err) {
      console.error("Erreur publication:", err);
      toast.error(err.message || "Erreur publication");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Publier un texte</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          className="w-full border p-2 rounded"
          placeholder="Nom de l'auteur"
        />
        <input
          value={authorEmail}
          onChange={(e) => setAuthorEmail(e.target.value)}
          className="w-full border p-2 rounded"
          placeholder="Email de l'auteur"
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border p-2 rounded"
          placeholder="Titre"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          className="w-full border p-2 rounded"
          placeholder="Contenu"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Publication..." : "Publier"}
        </button>
      </form>
    </div>
  );
}