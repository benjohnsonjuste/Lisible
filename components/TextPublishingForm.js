"use client";
import { useState } from "react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { app } from "../firebase"; // ton fichier de config Firebase

const storage = getStorage(app);
const db = getFirestore(app);

export default function TextPublishingForm() {
  const [formData, setFormData] = useState({
    auteur: "",
    titre: "",
    contenu: "",
    image: null,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      let imageURL = null;

      if (formData.image) {
        const imageRef = ref(storage, `images/${Date.now()}-${formData.image.name}`);
        await uploadBytes(imageRef, formData.image);
        imageURL = await getDownloadURL(imageRef);
      }

      await addDoc(collection(db, "texts"), {
        auteur: formData.auteur,
        titre: formData.titre,
        contenu: formData.contenu,
        image_url: imageURL,
        created_at: serverTimestamp(),
      });

      setMessage("Texte publié avec succès.");
      setFormData({ auteur: "", titre: "", contenu: "", image: null });
    } catch (err) {
      console.error("Erreur Firebase:", err);
      setMessage("Échec de la publication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 bg-white p-4 rounded-lg shadow-md max-w-xl mx-auto"
    >
      <input
        type="text"
        name="auteur"
        placeholder="Nom de l'auteur"
        className="border p-2 rounded"
        value={formData.auteur}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="titre"
        placeholder="Titre du texte"
        className="border p-2 rounded"
        value={formData.titre}
        onChange={handleChange}
        required
      />
      <textarea
        name="contenu"
        placeholder="Votre texte ici..."
        rows="6"
        className="border p-2 rounded"
        value={formData.contenu}
        onChange={handleChange}
        required
      />
      <input
        type="file"
        name="image"
        accept="image/*"
        onChange={handleChange}
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white rounded p-2 hover:bg-blue-700"
      >
        {loading ? "Publication en cours..." : "Publier"}
      </button>

      {message && <p className="text-center mt-2">{message}</p>}
    </form>
  );
}