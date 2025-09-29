import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import Link from "next/link";

export default function AuthorTextsList() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTexts = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setError("Vous devez être connecté pour voir vos textes.");
          setLoading(false);
          return;
        }

        // 🔹 Récupération des textes de l'auteur connecté
        const q = query(collection(db, "bibliotheque"), where("authorId", "==", user.uid));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setTexts([]);
        } else {
          setTexts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
      } catch (err) {
        console.error("Erreur lors du chargement des textes :", err);
        setError("Impossible de charger vos textes. Réessayez plus tard.");
      } finally {
        setLoading(false);
      }
    };

    fetchTexts();
  }, []);

  if (loading) {
    return <p className="text-center text-gray-500">Chargement de vos textes...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500">{error}</p>;
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md">
      <h2 className="text-2xl font-bold mb-4">Mes textes publiés</h2>

      {texts.length === 0 ? (
        <p className="text-gray-500 text-center">
          Vous n'avez encore publié aucun texte.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {texts.map((text) => (
            <div
              key={text.id}
              className="border rounded-xl overflow-hidden shadow hover:shadow-lg transition bg-gray-50"
            >
              {/* Image du texte ou placeholder */}
              <div className="h-40 overflow-hidden">
                <img
                  src={text.imageUrl || "/no_image.png"}
                  alt={text.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-lg truncate">{text.title}</h3>

                <p className="text-sm text-gray-600">
                  {text.genre} {text.character && `- ${text.character}`}
                </p>

                <div className="mt-2 text-sm text-gray-500">
                  Vues : <strong>{text.views || 0}</strong> | J'aime :{" "}
                  <strong>{text.likes || 0}</strong>
                </div>

                {/* Bouton pour aller au texte dans la bibliothèque */}
                <Link href={`/bibliotheque/${text.id}`} passHref>
                  <button className="mt-3 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
                    Lire dans la Bibliothèque
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}