import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import Link from "next/link";

export default function AuthorsList() {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuthors = async () => {
      setLoading(true);
      try {
        // Récupérer tous les textes
        const textsSnap = await getDocs(collection(db, "texts"));
        const authorIds = Array.from(new Set(textsSnap.docs.map(doc => doc.data().authorId)));

        if (authorIds.length === 0) {
          setAuthors([]);
          setLoading(false);
          return;
        }

        // Récupérer les infos des auteurs qui ont au moins un texte
        const authorsData = [];
        for (const id of authorIds) {
          const authorDoc = await getDocs(query(collection(db, "authors"), where("id", "==", id)));
          if (!authorDoc.empty) {
            const data = authorDoc.docs[0].data();
            authorsData.push({
              id,
              fullName: data.fullName,
              photoURL: data.photoURL || "/logo.png",
              subscribers: data.subscribers?.length || 0
            });
          }
        }
        setAuthors(authorsData);
      } catch (e) {
        console.error("Erreur lors du chargement des auteurs :", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAuthors();
  }, []);

  if (loading) return <p className="text-center">Chargement des auteurs...</p>;
  if (authors.length === 0) return <p className="text-center">Aucun auteur trouvé.</p>;

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Nos auteurs</h1>
      <div className="grid md:grid-cols-3 gap-6">
        {authors.map(a => (
          <div key={a.id} className="bg-white p-4 rounded shadow hover:shadow-lg transition text-center">
            <img
              src={a.photoURL}
              alt={a.fullName}
              className="w-24 h-24 rounded-full mx-auto mb-3 object-cover"
            />
            <h3 className="text-xl font-semibold">{a.fullName}</h3>
            <p className="text-gray-500">Abonnés : {a.subscribers}</p>
            <Link href={`/auteur/${a.id}`}>
              <a className="inline-block mt-2 text-blue-600 hover:underline">Voir les textes</a>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}