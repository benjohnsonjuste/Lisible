import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import Link from "next/link";

export default function AuthorTextsList({ authorId }) {
  const [texts, setTexts] = useState([]);

  useEffect(() => {
    const fetchTexts = async () => {
      const q = query(collection(db, "texts"), where("authorId", "==", authorId));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        likes: d.data().likes || 0, // Assurer que likes existe
        views: d.data().views || 0, // Assurer que views existe
      }));
      setTexts(data);
    };

    if (authorId) fetchTexts();
  }, [authorId]);

  return (
    <div className="bg-white p-6 rounded shadow mb-6">
      <h3 className="font-bold text-lg mb-3">Mes textes</h3>
      <ul>
        {texts.map(t => (
          <li key={t.id} className="flex justify-between border-b py-2 items-center">
            <Link href={`/bibliotheque/${t.id}`}>
              <a className="text-blue-600 font-medium">{t.title}</a>
            </Link>
            <div className="flex gap-4 text-sm text-gray-600">
              <span>{t.views} vues</span>
              <span>{t.likes} J'aime</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}