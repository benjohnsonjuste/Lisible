import { useState, useEffect } from "react";
import { db, storage, auth } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";

export default function PublishingForm() {
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [illustration, setIllustration] = useState(null);
  const [genre, setGenre] = useState("");
  const [caractere, setCaractere] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🔹 Écoute Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 🔹 Publication
  const handlePublish = async (e) => {
    e.preventDefault();
    setError(null);

    if (!user) return setError("Veuillez vous connecter pour publier.");
    if (!title.trim()) return setError("Le titre est obligatoire.");
    if (!content.trim() && !illustration)
      return setError("Ajoutez un texte et/ou une image d'illustration.");
    if (!genre) return setError("Veuillez sélectionner un genre.");
    if (!caractere) return setError("Veuillez sélectionner un caractère.");

    setLoading(true);

    try {
      let illustrationUrl = null;

      if (illustration) {
        const storageRef = ref(
          storage,
          `bibliotheque/${user.uid}/illustrations/${Date.now()}_${illustration.name}`
        );
        const uploadTask = uploadBytesResumable(storageRef, illustration);

        illustrationUrl = await new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            null,
            (err) => reject(err),
            async () => resolve(await getDownloadURL(uploadTask.snapshot.ref))
          );
        });
      }

      const newDoc = {
        title: title.trim(),
        content: content.trim(),
        illustrationUrl: illustrationUrl || null,
        genre,
        caractere,
        authorId: user.uid,
        authorName: user.displayName || "Auteur inconnu",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "bibliotheque"), newDoc);

      // Réinitialiser le formulaire
      setTitle("");
      setContent("");
      setIllustration(null);
      setGenre("");
      setCaractere("");

      alert("✅ Publication réussie !");
    } catch (err) {
      console.error("Erreur lors de la publication :", err);
      setError("Impossible de publier. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  if (!user)
    return (
      <p className="text-center text-red-500">
        Connectez-vous pour publier vos textes.
      </p>
    );

  return (
    <form
      onSubmit={handlePublish}
      className="bg-white p-6 rounded-2xl shadow-md space-y-4"
    >
      <h2 className="text-xl font-bold">Publier dans la bibliothèque</h2>

      {error && <p className="text-red-500">{error}</p>}

      <input
        type="text"
        placeholder="Titre du texte"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-2 border rounded-md"
        required
      />

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Écrivez votre texte ici (facultatif si vous ajoutez une image)..."
        className="w-full p-2 border rounded-md h-32"
      />

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setIllustration(e.target.files[0])}
        className="w-full p-2 border rounded-md"
      />

      <select
        value={genre}
        onChange={(e) => setGenre(e.target.value)}
        className="w-full p-2 border rounded-md"
        required
      >
        <option value="">Sélectionner le genre</option>
        <option value="Poésie">Poésie</option>
        <option value="Roman">Roman</option>
        <option value="Nouvelle">Nouvelle</option>
        <option value="Essai">Essai</option>
        <option value="Article">Article</option>
      </select>

      <select
        value={caractere}
        onChange={(e) => setCaractere(e.target.value)}
        className="w-full p-2 border rounded-md"
        required
      >
        <option value="">Sélectionner le caractère</option>
        <option value="Engagé">Engagé</option>
        <option value="Romantique">Romantique</option>
        <option value="Érotique">Érotique</option>
        <option value="Couleur locale">Couleur locale</option>
        <option value="Mélancolique">Mélancolique</option>
        <option value="Satyrique">Satyrique</option>
      </select>

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