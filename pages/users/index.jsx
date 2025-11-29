"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

export default function UsersPage() {
  const [authors, setAuthors] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("fullName"));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAuthors(list);
    });

    return () => unsub();
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Liste des utilisateurs</h1>

      <ul className="space-y-2">
        {authors.map((a) => (
          <li key={a.id} className="p-3 bg-gray-100 rounded">
            <strong>{a.fullName}</strong>
            <br />
            <span className="text-sm text-gray-500">{a.email}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}