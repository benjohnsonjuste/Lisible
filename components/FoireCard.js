// components/events/LivreCard.js
import { useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";

export default function LivreCard({ livre, user }) {
  const [liking, setLiking] = useState(false);

  const handleLike = async () => {
    if (!user) {
      alert("Connectez-vous pour aimer ce livre.");
      return;
    }
    setLiking(true);
    try {
      const livreRef = doc(db, "foireInscriptions", livre.id);
      await updateDoc(livreRef, {
        likes: livre.likes + 1,
        likedBy: arrayUnion(user.uid),
      });
    } catch (error) {
      console.error("Erreur lors du like :", error);
    } finally {
      setLiking(false);
    }
  };

  return (
    <div className="border rounded shadow p-4 mb-4 bg-white">
      <h3 className="font-bold text-lg mb-2">{livre.nom}</h3>
      <p className="text-sm mb-2">{livre.pays}</p>

      {/* Visionneuse intégrée */}
      <iframe
        src={livre.fileUrl}
        title={livre.nom}
        className="w-full h-96 border"
        sandbox="allow-scripts allow-same-origin"
      />

      <div className="flex justify-between items-center mt-4">
        <button
          onClick={handleLike}
          disabled={liking}
          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
        >
          👍 J'aime ({livre.likes})
        </button>

        <button
          onClick={() => {
            navigator.share({
              title: livre.nom,
              text: "Découvrez ce livre sur Lisible !",
              url: window.location.href,
            });
          }}
          className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
        >
          Partager
        </button>
      </div>
    </div>
  );
}
