// /app/author-dashboard/text-publishing/page.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function Page() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authorName, setAuthorName] = useState("AuteurTest");

  const toDataUrl = (file) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onerror = () => rej(new Error("File read error"));
    r.onload = () => res(r.result);
    r.readAsDataURL(file);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return toast.error("Titre et contenu requis");

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
          title, content, authorName, authorEmail: "", imageBase64, imageName
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || JSON.stringify(data));
      toast.success("Publié !");
      router.push(data.url.replace("https://github.com", "")); // redirect to repo page or adjust
    } catch (err) {
      console.error("publish error", err);
      toast.error(err.message || "Erreur publication");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Publier</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input value={authorName} onChange={(e)=>setAuthorName(e.target.value)} className="w-full border p-2 rounded" />
        <input value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full border p-2 rounded" placeholder="Titre"/>
        <textarea value={content} onChange={(e)=>setContent(e.target.value)} rows={8} className="w-full border p-2 rounded" placeholder="Contenu"/>
        <input type="file" onChange={(e)=>setImageFile(e.target.files?.[0]||null)} />
        <button disabled={loading} className="w-full py-2 bg-blue-600 text-white rounded">{loading ? "..." : "Publier"}</button>
      </form>
    </div>
  );
}