"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

type Author = {
  uid: string;
  email: string;
  fullName: string;
  followers: number;
  views: number;
};

export default function UsersPage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🔹 Récupération en temps réel des auteurs
    const q = query(collection(db, "authors"), orderBy("fullName"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({
          uid: d.id,
          ...(d.data() as any),
        })) as Author[];
        setAuthors(list);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Utilisateurs</h1>
      {loading ? (
        <p>Chargement...</p>
      ) : authors.length === 0 ? (
        <p>Aucun utilisateur pour le moment.</p>
      ) : (
        <ul className="space-y-2">
          {authors.map((a) => (
            <li
              key={a.uid}
              className="border rounded p-3 flex items-center justify-between"
            >
              <div>
                <p className="font-medium">{a.fullName || "Sans nom"}</p>
                <p className="text-sm text-gray-600">{a.email}</p>
              </div>
              <div className="text-right text-sm">
                <p>
                  <span className="font-medium">Followers:</span>{" "}
                  {a.followers ?? 0}
                </p>
                <p>
                  <span className="font-medium">Vues:</span> {a.views ?? 0}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}