// components/PublishingForm.js
import { useState } from "react";
import { db, storage } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function PublishingForm({ authorId }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [genre, setGenre] = useState("");
  const [character, setCharacter] = useState("");
  const [loading, setLoading] = useState(false);

  const publish = async () => {
    if (!authorId) {
      alert("Utilisateur non identifié. Veuillez vous reconnecter.");
      return;
    }

    if (!title.trim() || !content.trim()) {
      alert("Le titre et le contenu sont obligatoires.");
      return;
    }

    if (!genre) {
      alert("Veuillez choisir un genre pour votre texte.");
      return;
    }

    setLoading(true);

    try {
      let imageUrl = "/no_image.png";

      // Upload de l'image si elle existe
      if (image) {
        const imageRef = ref(storage, `texts/${authorId}/${Date.now()}_${image.name}`);
        await uploadBytes(imageRef, image);
        imageUrl = await getDownloadURL(imageRef);
      }

      // Envoi du texte à Firestore
      await addDoc(collection(db, "texts"), {
        authorId,
        title: title.trim(),
        content: content.trim(),
        genre,
        character,
        imageUrl,
        views: 0,
        likes: 0,
        likedBy: [],
        createdAt: serverTimestamp(),
      });

      // Réinitialiser le formulaire
      setTitle("");
      setContent("");
      setImage(null);
      setGenre("");
      setCharacter("");
      alert("Texte publié avec succès !");
    } catch (e) {
      console.error("Erreur lors de la publication :", e);
      alert("Erreur lors de la publication. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow mb-6 max-w-xl mx-auto">
      <h3 className="text-lg font-bold mb-4">Publier un nouveau texte</h3>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titre"
        className="w-full border p-2 rounded mb-3"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Contenu"
        className="w-full border p-2 rounded mb-3 h-40"
      />
      <label className="block mb-1 font-medium">Genre <span className="text-red-500">*</span></label>
      <select
        value={genre}
        onChange={(e) => setGenre(e.target.value)}
        className="w-full border p-2 rounded mb-3"
      >
        <option value="">-- Choisir un genre --</option>
        <option value="poesie">Poésie</option>
        <option value="nouvelle">Nouvelle</option>
        <option value="conte">Conte</option>
        <option value="roman">Roman</option>
      </select>
      <label className="block mb-1 font-medium">Caractère (facultatif)</label>
      <select
        value={character}
        onChange={(e) => setCharacter(e.target.value)}
        className="w-full border p-2 rounded mb-3"
      >
        <option value="">-- Aucun --</option>
        <option value="engage">Engagé</option>
        <option value="couleur_locale">Couleur locale</option>
        <option value="romanesque">Romanesque</option>
        <option value="erotique">Érotique</option>
        <option value="satyrique">Satyrique</option>
        <option value="lyrique">Lyrique</option>
      </select>
      <label className="block mb-1 font-medium">Image (facultatif)</label>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files[0])}
        className="mb-4"
      />
      <button
        onClick={publish}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:bg-gray-400"
      >
        {loading ? "Publication en cours..." : "Publier"}
      </button>
    </div>
  );
}