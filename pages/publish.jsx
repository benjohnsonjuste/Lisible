"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PublishPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Vérification simple : nom obligatoire
    if (!authorName.trim()) {
      alert("Veuillez entrer votre nom d'auteur !");
      return;
    }

    const res = await fetch("/api/texts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content,
        authorName: authorName.trim(),          // <-- nom saisi par l'auteur
        authorId: "user-" + Date.now(),         // ID unique pour cet auteur
        imageUrl: ""                             // optionnel : ajouter un champ pour image plus tard
      })
    });

    if (!res.ok) {
      alert("Erreur lors de la publication, réessayez.");
      return;
    }

    // Réinitialiser le formulaire
    setTitle("");
    setContent("");
    setAuthorName("");

    alert("Texte publié !");
    router.push("/texts"); // Redirection vers la bibliothèque
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded shadow max-w-lg mx-auto space-y-4"
    >
      <h1 className="text-2xl font-bold">Publier un texte</h1>

      {/* Nom de l'auteur */}
      <input
        type="text"
        value={authorName}
        onChange={(e) => setAuthorName(e.target.value)}
        placeholder="Votre nom d'auteur"
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

      <button type="submit" className="btn btn-primary">
        Publier
      </button>
    </form>
  );
}