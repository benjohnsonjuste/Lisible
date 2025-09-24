// components/AuthorTextsList.jsx
"use client";
import { useEffect, useState } from "react";
import { db } from "@/firebase/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import Link from "next/link";

export default function AuthorTextsList({ authorId }) {
  const [texts, setTexts] = useState([]);

  useEffect(() => {
    const fetchTexts = async () => {
      const q = query(collection(db, "texts"), where("authorId", "==", authorId));
      const querySnapshot = await getDocs(q);

      const authorTexts = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setTexts(authorTexts);
    };

    fetchTexts();
  }, [authorId]);

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Mes textes</h2>
      <ul>
        {texts.map((text) => (
          <li key={text.id} className="flex justify-between py-2 border-b">
            <Link href={`/bibliotheque/${text.id}`}>
              <span className="text-blue-600 hover:underline cursor-pointer">
                {text.title}
              </span>
            </Link>
            <span>{text.views} vues</span>
          </li>
        ))}
      </ul>
    </div>
  );
      }
