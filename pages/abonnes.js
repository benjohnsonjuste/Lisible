"use client";

import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { db } from "@/firebase";
import { collectionGroup, getDocs } from "firebase/firestore";

export default function AbonnesPage() {
  const [abonnes, setAbonnes] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const fetchAbonnes = async () => {
      try {
        // 🔹 On récupère tous les abonnements Firestore
        const subsSnapshot = await getDocs(collectionGroup(db, "subscriptions"));
        const allSubs = subsSnapshot.docs.map((d) => ({
          followerPath: d.ref.path.split("/"),
          ...d.data(),
        }));

        // 🔹 On filtre ceux qui suivent le user actuel
        const myAbonnes = allSubs
          .filter((sub) => sub.authorId === currentUser.uid)
          .map((sub) => sub.followerPath[1]); // récupère le follower UID

        // 🔹 Récupère les infos des followers depuis l'API Firebase Admin
        const res = await fetch("/api/get-authors");
        const allUsers = await res.json();
        const abonnesInfos = allUsers.filter((u) => myAbonnes.includes(u.uid));

        setAbonnes(abonnesInfos);
      } catch (err) {
        console.error("Erreur chargement abonnés :", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAbonnes();
  }, [currentUser]);

  if (!currentUser)
    return (
      <div className="text-center mt-12 text-gray-500">
        Connectez-vous pour voir vos abonnés.
      </div>
    );

  if (loading)
    return <p className="text-center mt-10 text-gray-500">Chargement des abonnés...</p>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">👤 Mes abonnés</h1>

        {abonnes.length === 0 ? (
          <p className="text-center text-gray-500">
            Vous n'avez pas encore d'abonnés.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {abonnes.map((abonne) => (
              <div
                key={abonne.uid}
                className="bg-white rounded-xl shadow p-4 flex flex-col items-center space-y-3 hover:shadow-lg transition"
              >
                <img
                  src={abonne.photoURL || "/avatar.png"}
                  alt={abonne.displayName || abonne.email}
                  className="w-20 h-20 rounded-full object-cover border"
                />
                <h2 className="font-semibold text-center">
                  {abonne.displayName || abonne.email}
                </h2>
                <p className="text-sm text-gray-500">{abonne.email}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}