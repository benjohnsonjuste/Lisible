// pages/bibliotheque.js
import Layout from "../components/Layout";
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
        const allTexts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTexts(allTexts);
      } catch (err) {
        console.error("Erreur lors du chargement des textes :", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTexts();
  }, []);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6 mt-12">
        <h1 className="text-4xl font-bold mb-10 text-center">Bibliothèque</h1>

        {loading ? (
          <p className="text-center text-gray-600">Chargement des textes...</p>
        ) : texts.length === 0 ? (
          <p className="text-center text-gray-600">Aucun texte publié pour l’instant.</p>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {texts.map((text) => (
              <div key={text.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                <h2 className="text-xl font-semibold mb-2">{text.title}</h2>
                <p className="text-gray-700 mb-4">{text.content.length > 150 ? text.content.slice(0, 150) + "..." : text.content}</p>
                <p className="text-gray-500 text-sm">
                  Auteur : {text.authorName} <br />
                  Publié le {text.createdAt?.toDate ? text.createdAt.toDate().toLocaleDateString() : new Date(text.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}