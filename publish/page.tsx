"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function Page() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [authorName, setAuthorName] = useState("AuteurTest");
  const [authorEmail, setAuthorEmail] = useState("");

  const toDataUrl = (file: File) =>
    new Promise<string>((res, rej) => {
      const reader = new FileReader();
      reader.onerror = () => rej(new Error("Erreur lecture du fichier"));
      reader.onload = () => res(reader.result as string);
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return toast.error("Titre et contenu requis");

    setLoading(true);
    try {
      let imageBase64: string | null = null;
      let imageName: string | null = null;
      if (imageFile) {
        imageBase64 = await toDataUrl(imageFile);
        imageName = imageFile.name;
      }

      const res = await fetch("/api/publish-github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, authorName, authorEmail, imageBase64, imageName }),
      });

      let data;
      try { data = await res.json(); } catch { data = null; }

      if (!res.ok || !data) throw new Error(data?.error || "Erreur publication");

      toast.success("Texte publié avec succès !");
      router.push(data.url.replace("https://github.com", ""));
    } catch (err: any) {
      console.error("publish error", err);
      toast.error(err.message || "Erreur publication");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white text-black rounded shadow-md">
      <h1 className="text-2xl font-bold mb-4">Publier un texte</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Nom auteur"
        />
        <input
          value={authorEmail}
          onChange={(e) => setAuthorEmail(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Email auteur (optionnel)"
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Titre"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Contenu"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          className="w-full"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-black text-white rounded hover:bg-gray-900 transition"
        >
          {loading ? "Publication..." : "Publier"}
        </button>
      </form>
    </div>
  );
}