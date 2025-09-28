import { useState, useEffect } from "react";
import { db, storage, auth } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";

export default function PublishingForm() {
  const [user, setUser] = useState(null); // 🔹 Récupérer automatiquement l'auteur connecté
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [illustration, setIllustration] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🔹 Vérifier l'utilisateur connecté
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handlePublish = async (e) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("Vous devez être connecté pour publier un texte.");
      return;
    }

    if (!title.trim() || !content.trim()) {
      setError("Le titre et le contenu sont obligatoires.");
      return;
    }

    setLoading(true);

    try {
      let illustrationUrl = null;

      // 🔹 Upload de l'image si elle existe
      if (illustration) {
        const storageRef = ref(
          storage,
          `textIllustrations/${user.uid}/${Date.now()}_${illustration.name}`
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
        illustrationUrl: illustrationUrl || null,
        authorId: user.uid,
        authorName: user.displayName || "Auteur inconnu",
        createdAt: serverTimestamp(),
      };

      // 🔹 Vérifier la collection publique
      const publicRef = collection(db, "bibliotheque");
      await addDoc(publicRef, newText);

      // 🔹 Vérifier la collection privée
      const authorRef = collection(db, "auteurs", user.uid, "textes");
      await addDoc(authorRef, newText);

      // 🔹 Réinitialiser le formulaire
      setTitle("");
      setContent("");
      setIllustration(null);
      alert("✅ Texte publié avec succès !");
    } catch (err) {
      console.error("Erreur lors de la publication :", err);
      setError(`Impossible de publier le texte : ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <p className="text-center text-red-500">Veuillez vous connecter pour publier un texte.</p>;
  }

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