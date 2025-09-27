// components/TextSubmissionForm.js
import { useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function TextSubmissionForm({ eventId, phase, authorId }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const submitText = async () => {
    if (!title.trim() || !content.trim()) {
      alert("Le titre et le contenu sont obligatoires.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "eventTexts"), {
        eventId,
        phase,
        authorId,
        title: title.trim(),
        content: content.trim(),
        likes: 0,
        createdAt: serverTimestamp(),
      });
      alert("Texte soumis avec succès !");
      setTitle("");
      setContent("");
    } catch (error) {
      console.error("Erreur lors de la soumission :", error);
      alert("Impossible de soumettre le texte. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-bold mb-3">Soumettre un texte - Phase {phase}</h3>
      <input
        type="text"
        placeholder="Titre du texte"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border p-2 rounded mb-3"
      />
      <textarea
        placeholder="Contenu du texte"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full border p-2 rounded mb-3 h-40"
      />
      <button
        onClick={submitText}
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
      >
        {loading ? "Soumission..." : "Soumettre"}
      </button>
    </div>
  );
}