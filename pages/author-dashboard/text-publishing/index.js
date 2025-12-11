"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function PublishPage() {
  const router = useRouter();
  const [authorName, setAuthorName] = useState("AuteurTest");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Convert file → base64
  const toBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Erreur lecture fichier"));
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  };

  const handlePublish = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      return toast.error("Titre et contenu requis");
    }

    setLoading(true);

    try {
      let imageBase64 = null;
      let imageName = null;

      if (imageFile) {
        imageBase64 = await toBase64(imageFile);
        imageName = imageFile.name;
      }

      const res = await fetch("/api/publish-github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          authorName,
          authorEmail: "",
          createdAt: Date.now(),
          imageBase64,
          imageName,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erreur publication");

      toast.success("Texte publié avec succès !");

      // Change URL GitHub vers ton site
      const id = data.url.split("/").pop().replace(".md", "");

      router.push(`/texts/${id}`);
    } catch (err) {
      console.error("ERROR PUBLISH:", err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Publier un texte</h1>

      <form onSubmit={handlePublish} className="space-y-4">
        <input
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          className="w-full border p-2 rounded"
          placeholder="Nom de l'auteur"
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
          rows={10}
          className="w-full border p-2 rounded"
          placeholder="Contenu"
        />

        <input
          type="file"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        />

        <button
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {loading ? "Publication..." : "Publier"}
        </button>
      </form>
    </div>
  );
}