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

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => data.append(key, value));

    const res = await fetch("/api/publish", {
      method: "POST",
      body: data,
    });

    const result = await res.json();
    setLoading(false);
    setMessage(result.message || result.error);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 bg-white p-4 rounded-lg shadow-md max-w-xl mx-auto"
    >
      <input
        name="auteur"
        placeholder="Nom de l'auteur"
        className="border p-2 rounded"
        onChange={handleChange}
        required
      />
      <input
        name="titre"
        placeholder="Titre du texte"
        className="border p-2 rounded"
        onChange={handleChange}
        required
      />
      <textarea
        name="contenu"
        placeholder="Votre texte ici..."
        rows="6"
        className="border p-2 rounded"
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