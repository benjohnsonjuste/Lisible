import { useState } from "react";
import { db, storage } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

export default function PublishingForm({ authorId }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [illustration, setIllustration] = useState(null);
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
      let illustrationUrl = null;

      if (illustration) {
        const storageRef = ref(
          storage,
          `textIllustrations/${authorId}/${Date.now()}_${illustration.name}`
        );
        const uploadTask = uploadBytesResumable(storageRef, illustration);

        illustrationUrl = await new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            null,
            (err) => reject(err),
            async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(url);
            }
          );
        });
      }

      const newText = {
        title: title.trim(),
        content: content.trim(),
        illustrationUrl,
        authorId,
        createdAt: serverTimestamp(),
      };

      // Publier dans la collection publique "bibliotheque"
      const publicRef = collection(db, "bibliotheque");
      await addDoc(publicRef, newText);

      // Publier dans la collection privée de l'auteur "auteurs/{authorId}/textes"
      const authorRef = collection(db, "auteurs", authorId, "textes");
      await addDoc(authorRef, newText);

      // Réinitialiser le formulaire
      setTitle("");
      setContent("");
      setIllustration(null);
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

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setIllustration(e.target.files[0])}
        className="w-full p-2 border rounded-md"
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