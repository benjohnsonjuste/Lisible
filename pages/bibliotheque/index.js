// /pages/library.js
import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, query, getDocs } from "firebase/firestore";

export default function Library() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTexts = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "bibliotheque"));
      const snapshot = await getDocs(q);
      const allTexts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTexts(allTexts);
    } catch (e) {
      console.error("Erreur lors du chargement :", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTexts();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Bibliothèque</h1>
      {loading && <p className="text-center">Chargement...</p>}
      {texts.map(t => (
        <div key={t.id} className="bg-white p-4 mb-4 rounded shadow">
          <h2 className="text-xl font-semibold">{t.title}</h2>
          <p>Auteur : {t.authorName || "Anonyme"}</p>
        </div>
      ))}
    </div>
  );
}