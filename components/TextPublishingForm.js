"use client";
import { useState } from "react";

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
      let imageURL = "";

      if (formData.image) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          imageURL = reader.result;

          await sendToSheets(imageURL);
        };
        reader.readAsDataURL(formData.image);
      } else {
        await sendToSheets("");
      }
    } catch (err) {
      console.error("Erreur de publication :", err);
      setMessage("Échec de la publication.");
      setLoading(false);
    }
  };

  const sendToSheets = async (imageURL) => {
    try {
      const webhookURL = "https://script.google.com/macros/s/AKfycbyAyvh4_2ntzSZftpa77BS6Mt6YrHfkatD3X_TqfktmJakpGUwEHItLLmPN1x4-1or0/exec";

      await fetch(webhookURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auteur: formData.auteur,
          titre: formData.titre,
          contenu: formData.contenu,
          image_url: imageURL,
        }),
      });

      setMessage("Texte publié avec succès.");
      setFormData({ auteur: "", titre: "", contenu: "", image: null });
    } catch (err) {
      console.error("Erreur Sheets:", err);
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
        className="bg-green-600 text-white rounded p-2 hover:bg-green-700"
      >
        {loading ? "Publication en cours..." : "Publier"}
      </button>

      {message && <p className="text-center mt-2">{message}</p>}
    </form>
  );
}