"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

export default function UsersPage() {
  const [authors, setAuthors] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "authors"), orderBy("fullName"));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAuthors(list);
    }, (err) => {
      console.error("Firestore subscribe error:", err);
    });

    return () => unsub();
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Liste des utilisateurs</h1>

      {authors.length === 0 ? (
        <p className="text-sm text-gray-500">Aucun utilisateur trouvé.</p>
      ) : (
        <ul className="space-y-3">
          {authors.map((a) => (
            <li key={a.uid || a.id} className="p-3 bg-gray-50 rounded border">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{a.fullName || a.displayName || "Utilisateur"}</div>
                  <div className="text-xs text-gray-500">{a.email}</div>
                </div>
                <div className="text-xs text-gray-400">{new Date(a.createdAt || Date.now()).toLocaleString()}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}