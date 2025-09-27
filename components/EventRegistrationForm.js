// components/EventRegistrationForm.js
import { useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function EventRegistrationForm({ eventId }) {
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const register = async () => {
    if (!fullName.trim() || !country.trim() || !email.trim()) {
      alert("Tous les champs sont obligatoires.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "eventRegistrations"), {
        eventId,
        fullName: fullName.trim(),
        country,
        email: email.trim(),
        createdAt: serverTimestamp(),
      });
      alert("Inscription réussie !");
      setFullName("");
      setCountry("");
      setEmail("");
    } catch (error) {
      console.error("Erreur d'inscription :", error);
      alert("Erreur lors de l'inscription. Réessayez plus tard.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-bold mb-4">Inscription au concours</h3>
      <input
        type="text"
        placeholder="Nom complet"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        className="w-full border p-2 rounded mb-3"
      />
      <select
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        className="w-full border p-2 rounded mb-3"
      >
        <option value="">-- Sélectionnez votre pays --</option>
        <option value="Haiti">Haïti</option>
        <option value="France">France</option>
        <option value="Sénégal">Sénégal</option>
        <option value="Canada">Canada</option>
      </select>
      <input
        type="email"
        placeholder="Adresse électronique"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border p-2 rounded mb-3"
      />
      <button
        onClick={register}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? "Inscription en cours..." : "S'inscrire"}
      </button>
    </div>
  );
}