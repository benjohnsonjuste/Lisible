// components/TextPublishingForm.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input"; // si tu as ce composant, sinon input normal
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function TextPublishingForm() {
  const router = useRouter();
  const { user } = useAuth(); // adapte selon ton contexte auth
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

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
      toast.error("Titre et contenu requis");
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
        authorName: user?.displayName || user?.email || "Auteur inconnu",
        authorEmail: user?.email || "",
        imageBase64,
        imageName,
      };

      const res = await fetch("/api/publish-github", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        console.error("publish error", json);
        throw new Error(json.error || "Publication échouée");
      }

      toast.success("✅ Publication réussie !");
      setTitle("");
      setContent("");
      setImageFile(null);
      router.push("/bibliotheque");
    } catch (err) {
      console.error("publish client error", err);
      toast.error("❌ Erreur de publication");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 bg-white rounded shadow space-y-4">
      <h2 className="text-xl font-semibold">Publier un texte</h2>

      <div>
        <label className="block text-sm">Titre</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2 border rounded" />
      </div>

      <div>
        <label className="block text-sm">Contenu</label>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} className="w-full p-2 border rounded" />
      </div>

      <div>
        <label className="block text-sm">Image d'illustration (optionnel)</label>
        <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
      </div>

      <div>
        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
          {loading ? "Publication..." : "Publier sur GitHub"}
        </button>
      </div>
    </form>
  );
}