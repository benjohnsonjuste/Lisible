import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";

export default function TextDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger le texte depuis Firestore
  useEffect(() => {
    if (!id) return;

    const fetchText = async () => {
      try {
        const docRef = doc(db, "bibliotheque", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          // Incrémenter le compteur de vues
          await updateDoc(docRef, {
            views: increment(1),
          });

          setText({ id: docSnap.id, ...data });
        } else {
          setError("Texte non trouvé.");
        }
      } catch (err) {
        console.error("Erreur lors du chargement :", err);
        setError("Impossible de charger le texte. Réessayez plus tard.");
      } finally {
        setLoading(false);
      }
    };

    fetchText();
  }, [id]);

  // Affichage pendant le chargement
  if (loading) {
    return <p className="text-center mt-10">Chargement du texte...</p>;
  }

  // Si erreur ou texte introuvable
  if (error) {
    return (
      <div className="text-center mt-10">
        <p className="text-red-500 text-lg font-semibold">{error}</p>
        <Link
          href="/bibliotheque"
          className="text-blue-600 hover:underline mt-4 inline-block"
        >
          ← Retour à la bibliothèque
        </Link>
      </div>
    );
  }

  // Si texte trouvé
  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Bouton retour */}
      <div className="mb-4">
        <Link href="/bibliotheque" className="text-blue-600 hover:underline">
          ← Retour à la bibliothèque
        </Link>
      </div>

      {/* Titre et auteur */}
      <h1 className="text-3xl font-bold text-gray-800">{text.title}</h1>
      <p className="text-gray-500 mb-4">
        par {text.authorName || "Anonyme"}
      </p>

      {/* Contenu */}
      <div className="mt-6 p-4 bg-white rounded-lg shadow whitespace-pre-line">
        {text.content}
      </div>

      {/* Statistiques */}
      <div className="mt-4 text-sm text-gray-500 flex justify-between">
        <span>Vues : {text.views || 0}</span>
        <span>Likes : {text.likes || 0}</span>
      </div>
    </div>
  );
}