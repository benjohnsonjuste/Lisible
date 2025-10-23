"use client";

import { useState } from "react";

export default function TextPublishingForm() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    if (image) formData.append("image", image);

    const res = await fetch("/api/publish-text", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      alert("Texte publié !");
      setTitle("");
      setContent("");
      setImage(null);
    } else {
      alert("Erreur lors de la publication");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-xl max-w-lg mx-auto">
      <input
        type="text"
        placeholder="Titre du texte"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-2 border rounded"
        required
      />
      <textarea
        placeholder="Écris ton texte ici..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full p-2 border rounded min-h-[150px]"
        required
      />
      <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
      <button disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded w-full">
        {loading ? "Publication..." : "Publier"}
      </button>
    </form>
  );
}
