"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react"; // Récupérer la session

export default function PublishPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const router = useRouter();
  const { data: session } = useSession(); // <-- session active

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!session) {
      alert("Vous devez être connecté pour publier.");
      return;
    }

    await fetch("/api/texts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content,
        authorName: session.user.name, // <-- Nom du compte connecté
        authorId: session.user.id,     // <-- ID du compte connecté
        imageUrl: ""
      })
    });

    setTitle("");
    setContent("");
    alert("Texte publié !");
    router.push("/texts");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Publier un texte</h1>
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Titre"
        className="w-full p-2 border rounded"
        required
      />
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Contenu"
        className="w-full p-2 border rounded h-40"
        required
      />
      <button type="submit" className="btn btn-primary">Publier</button>
    </form>
  );
}