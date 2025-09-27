// components/events/FoireInscriptionForm.js
import { useState } from "react";
import { db, storage } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function FoireInscriptionForm() {
  const [nom, setNom] = useState("");
  const [pays, setPays] = useState("");
  const [email, setEmail] = useState("");
  const [modePaiement, setModePaiement] = useState("");
  const [coordPaiement, setCoordPaiement] = useState("");
  const [fichier, setFichier] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInscription = async () => {
    if (!nom.trim() || !pays.trim() || !email.trim() || !modePaiement.trim() || !fichier) {
      alert("Tous les champs sont obligatoires, y compris le fichier du livre.");
      return;
    }

    setLoading(true);

    try {
      // Upload du fichier
      const fileRef = ref(storage, `foire/${Date.now()}_${fichier.name}`);
      await uploadBytes(fileRef, fichier);
      const fileUrl = await getDownloadURL(fileRef);

      // Envoi des données à Firestore
      await addDoc(collection(db, "foireInscriptions"), {
        nom,
        pays,
        email,
        modePaiement,
        coordPaiement,
        fileUrl,
        likes: 0,
        comments: [],
        createdAt: serverTimestamp(),
      });

      alert("Inscription réussie et livre soumis !");
      setNom("");
      setPays("");
      setEmail("");
      setModePaiement("");
      setCoordPaiement("");
      setFichier(null);
    } catch (error) {
      console.error("Erreur lors de l'inscription :", error);
      alert("Erreur lors de l'inscription. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Inscription à la Foire Virtuelle</h2>

      <input
        type="text"
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        placeholder="Nom complet"
        className="w-full border p-2 rounded mb-3"
      />
      <input
        type="text"
        value={pays}
        onChange={(e) => setPays(e.target.value)}
        placeholder="Pays"
        className="w-full border p-2 rounded mb-3"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Adresse électronique"
        className="w-full border p-2 rounded mb-3"
      />

      <label className="block font-medium">Mode de paiement</label>
      <select
        value={modePaiement}
        onChange={(e) => setModePaiement(e.target.value)}
        className="w-full border p-2 rounded mb-3"
      >
        <option value="">-- Sélectionner --</option>
        <option value="paypal">PayPal</option>
        <option value="zelle">Zelle</option>
        <option value="moncash">MonCash</option>
        <option value="autre">Autre</option>
      </select>

      <input
        type="text"
        value={coordPaiement}
        onChange={(e) => setCoordPaiement(e.target.value)}
        placeholder="Coordonnées de paiement"
        className="w-full border p-2 rounded mb-3"
      />

      <label className="block font-medium">Upload du livre</label>
      <input
        type="file"
        accept=".pdf,.epub,.doc,.docx"
        onChange={(e) => setFichier(e.target.files[0])}
        className="w-full mb-3"
      />

      <button
        onClick={handleInscription}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? "Envoi en cours..." : "S'inscrire et soumettre le livre"}
      </button>
    </div>
  );
}