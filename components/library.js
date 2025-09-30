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
    <div>
      <h1>Bibliothèque</h1>
      {loading ? <p>Chargement...</p> : null}
      {texts.map(t => (
        <div key={t.id}>
          <h2>{t.title}</h2>
          <p>Auteur : {t.authorName || "Anonyme"}</p>
        </div>
      ))}
    </div>
  );
}