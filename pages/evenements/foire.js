// pages/events/foire.js
import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import LivreCard from "@/components/LivreCard";

export default function Foire() {
  const [livres, setLivres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLivres = async () => {
      const snapshot = await getDocs(collection(db, "foireInscriptions"));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLivres(data);
      setLoading(false);
    };

    fetchLivres();
  }, []);

  if (loading) return <p>Chargement en cours...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Foire Virtuelle Cheikh Anta Diop</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {livres.map(livre => (
          <LivreCard key={livre.id} livre={livre} />
        ))}
      </div>
    </div>
  );
}