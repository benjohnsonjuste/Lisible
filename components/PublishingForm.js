import { useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function PublishingForm({ authorId }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePublish = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!title.trim() || !content.trim()) {
      setError("Le titre et le contenu sont obligatoires.");
      setLoading(false);
      return;
    }

    try {
      // 1. Données communes pour les deux collections
      const newText = {
        title: title.trim(),
        content: content.trim(),
        authorId,
        createdAt: serverTimestamp(),
      };

      // 2. Publier dans la collection publique "bibliotheque"
      const publicRef = collection(db, "bibliotheque");
      await addDoc(publicRef, newText);

      // 3. Publier dans la collection privée de l'auteur "auteurs/{authorId}/textes"
      const authorRef = collection(db, "auteurs", authorId, "textes");
      await addDoc(authorRef, newText);

      // 4. Réinitialiser le formulaire
      setTitle("");
      setContent("");
      alert("Texte publié avec succès !");
    } catch (err) {
      console.error("Erreur lors de la publication :", err);
      setError("Impossible de publier le texte. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handlePublish}
      className="bg-white p-4 rounded-2xl shadow-md space-y-4"
    >
      <h2 className="text-xl font-semibold">Publier un texte</h2>

      {error && <p className="text-red-500">{error}</p>}

      <input
        type="text"
        placeholder="Titre du texte"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-2 border rounded-md"
      />

      <textarea
        placeholder="Écrivez votre texte ici..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full p-2 border rounded-md h-40"
      />

      <button
        type="submit"
        disabled={loading}
        className={`w-full p-2 rounded-md text-white ${
          loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {loading ? "Publication en cours..." : "Publier"}
      </button>
    </form>
  );
}