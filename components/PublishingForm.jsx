"use client";
import { useState } from "react";
import ImageUpload from "./ImageUpload";

export default function PublishingForm({ onPublish }) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const submit = () => {
    if (!title || !text) return alert("Titre et texte requis");
    onPublish({ title, text, imageUrl });
    setTitle(""); setText(""); setImageUrl("");
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-6">
      <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Titre" className="w-full border p-2 rounded mb-2" />
      <textarea value={text} onChange={(e)=>setText(e.target.value)} rows={6} className="w-full border p-2 rounded mb-2" placeholder="Écris ton texte ici..."/>
      <ImageUpload onUploaded={(url)=>setImageUrl(url)} />
      <div className="flex items-center justify-between">
        <button onClick={submit} className="bg-green-600 text-white px-4 py-2 rounded">Publier</button>
        {imageUrl && <a href={imageUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600">Voir image</a>}
      </div>
    </div>
  );
}
