// components/AuthorStats.jsx
"use client";
import { useEffect, useState } from "react";
import { db } from "@/firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export default function AuthorStats({ authorId }) {
  const [stats, setStats] = useState({ followers: 0, views: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const docRef = doc(db, "authors", authorId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setStats(docSnap.data());
      }
    };

    fetchStats();
  }, [authorId]);

  const revenue = (stats.views / 1000) * 0.2;

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-white p-4 rounded shadow text-center">
        <h2 className="text-lg font-semibold">Abonnés</h2>
        <p className="text-2xl font-bold">{stats.followers}</p>
      </div>
      <div className="bg-white p-4 rounded shadow text-center">
        <h2 className="text-lg font-semibold">Vues</h2>
        <p className="text-2xl font-bold">{stats.views}</p>
      </div>
      <div className="bg-white p-4 rounded shadow text-center">
        <h2 className="text-lg font-semibold">Revenus</h2>
        <p className="text-2xl font-bold">${revenue.toFixed(2)}</p>
      </div>
    </div>
  );
}
