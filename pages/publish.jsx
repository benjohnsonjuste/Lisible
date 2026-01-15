"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PublishPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!authorName.trim()) {
      alert("Veuillez entrer votre nom !");
      return;
    }

    // Préparer le corps de la requête
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("authorName", authorName.trim());
    formData.append("authorId", "user-" + Date.now());
    if (imageFile) formData.append("image", imageFile);

    // Envoyer la requête POST à l'API
    const res = await fetch("/api/texts", {
      method: "POST",
      body: formData
    });

    if (!res.ok) {
      alert("Erreur de publication, réessayez !");
      return;
    }

    setTitle("");
    setContent("");
    setAuthorName("");
    setImageFile(null);

    alert("Texte publié !");
    router.push("/texts"); // Redirection vers la bibliothèque
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded shadow max-w-lg mx-auto space-y-4"
      encType="multipart/form-data"
    >
      <h1 className="text-2xl font-bold">Publier un texte</h1>

      {/* Nom de l'auteur */}
      <input
        type="text"
        value={authorName}
        onChange={(e) => setAuthorName(e.target.value)}
        placeholder="Votre nom"
        className="w-full p-2 border rounded"
        required
      />

      {/* Titre */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titre du texte"
        className="w-full p-2 border rounded"
        required
      />

      {/* Contenu */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Contenu du texte"
        className="w-full p-2 border rounded h-40"
        required
      />

      {/* Image */}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files[0])}
        className="w-full"
      />

      <button type="submit" className="btn btn-primary">
        Publier
      </button>
    </form>
  );
}