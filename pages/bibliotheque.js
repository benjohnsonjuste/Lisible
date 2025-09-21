// pages/bibliotheque.js
import { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export default function Bibliotheque() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTexts = async () => {
      try {
        const q = query(collection(db, "texts"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setTexts(data);
      } catch (err) {
        console.error("Erreur lors du chargement des textes :", err);
      }
      setLoading(false);
    };

    fetchTexts();
  }, []);

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Chargement...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Bibliothèque</h1>

      {texts.length === 0 ? (
        <p className="text-gray-500 text-center">
          Aucun texte publié pour le moment.
        </p>
      ) : (
        <div className="grid gap-6">
          {texts.map((text) => (
            <div
              key={text.id}
              className="border border-gray-200 rounded-lg p-4 shadow hover:shadow-md transition"
            >
              <h2 className="text-xl font-semibold text-gray-800">{text.title}</h2>
              <p className="text-gray-600 mt-2 line-clamp-3">{text.content}</p>
              <p className="text-sm text-gray-400 mt-2">
                Par {text.authorName || "Anonyme"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}