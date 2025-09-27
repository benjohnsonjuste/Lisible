import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import LisibleClub from "@/components/LisibleClub";

export default function LisibleClubPage() {
  const [authors, setAuthors] = useState([]);
  const [user, setUser] = useState(null);

  // Vérifier utilisateur connecté
  useEffect(() => {
    setUser(auth.currentUser);
  }, []);

  // Charger les auteurs qui ont publié au moins un post dans Lisible Club
  const fetchAuthors = async () => {
    try {
      const postsSnapshot = await getDocs(collection(db, "clubPosts"));
      const authorIds = [...new Set(postsSnapshot.docs.map(doc => doc.data().authorId))];

      if (authorIds.length === 0) {
        setAuthors([]);
        return;
      }

      const authorsData = [];
      for (const id of authorIds) {
        const q = query(collection(db, "authors"), where("uid", "==", id));
        const snapshot = await getDocs(q);
        snapshot.forEach(doc => authorsData.push({ id: doc.id, ...doc.data() }));
      }
      setAuthors(authorsData);
    } catch (e) {
      console.error("Erreur lors du chargement des auteurs :", e);
    }
  };

  useEffect(() => {
    fetchAuthors();
  }, []);

  if (!user) {
    return <p className="text-center mt-8">Connectez-vous pour accéder à Lisible Club.</p>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Lisible Club</h1>

      {/* Liste des auteurs participants */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-2xl font-semibold mb-4">Auteurs participants</h2>
        {authors.length === 0 ? (
          <p>Aucun auteur n'a encore publié dans le club.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {authors.map(a => (
              <div key={a.id} className="flex flex-col items-center p-2 border rounded">
                <img
                  src={a.photoURL || "/logo.png"}
                  alt={a.fullName}
                  className="w-20 h-20 rounded-full object-cover mb-2"
                />
                <p className="font-semibold text-center">{a.fullName}</p>
                <p className="text-sm text-gray-500">Abonnés : {a.subscribers?.length || 0}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mur Lisible Club */}
      <LisibleClub />
    </div>
  );
}