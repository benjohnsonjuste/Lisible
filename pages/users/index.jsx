"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { useUserProfile } from "@/hooks/useUserProfile";

// 🔹 Charge les utilisateurs depuis GitHub
async function getUsersFromGitHub() {
  try {
    const res = await fetch("/api/get-users-github");
    if (!res.ok) throw new Error("Aucune donnée GitHub trouvée");
    const data = await res.json();
    return data.users || [];
  } catch (err) {
    console.warn("⚠️ Impossible de charger depuis GitHub :", err);
    return [];
  }
}

// 🔹 Enregistre les utilisateurs sur GitHub
async function saveUsersToGitHub(updatedUsers) {
  try {
    const res = await fetch("/api/update-users-github", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updatedUsers }),
    });
    if (!res.ok) throw new Error("Échec de la sauvegarde sur GitHub");
    console.log("✅ Utilisateurs mis à jour sur GitHub");
  } catch (error) {
    console.error("❌ Erreur GitHub :", error);
  }
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUserProfile();

  // 🔹 Charger les utilisateurs depuis GitHub puis Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // 1️⃣ On essaie GitHub d’abord
        const githubUsers = await getUsersFromGitHub();
        if (githubUsers.length > 0) {
          setUsers(githubUsers);
          setLoading(false);
          return;
        }

        // 2️⃣ Si GitHub vide, on récupère Firestore
        const q = query(collection(db, "authors"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const usersData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          followers: [],
          ...doc.data(),
        }));

        setUsers(usersData);
        // 3️⃣ On sauvegarde sur GitHub pour la persistance
        await saveUsersToGitHub(usersData);
      } catch (err) {
        console.error("Erreur lors du chargement des utilisateurs :", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // 🔹 Suivre / Ne plus suivre un utilisateur
  const toggleFollow = async (targetUser) => {
    if (!user) {
      alert("Connectez-vous pour suivre un utilisateur !");
      return;
    }

    const targetRef = doc(db, "authors", targetUser.id);
    try {
      let updatedUsersCopy;

      if (targetUser.followers?.includes(user.uid)) {
        await updateDoc(targetRef, {
          followers: arrayRemove(user.uid),
        });
        updatedUsersCopy = users.map((u) =>
          u.id === targetUser.id
            ? { ...u, followers: u.followers.filter((uid) => uid !== user.uid) }
            : u
        );
      } else {
        await updateDoc(targetRef, {
          followers: arrayUnion(user.uid),
        });
        updatedUsersCopy = users.map((u) =>
          u.id === targetUser.id
            ? { ...u, followers: [...(u.followers || []), user.uid] }
            : u
        );
      }

      setUsers(updatedUsersCopy);
      await saveUsersToGitHub(updatedUsersCopy);
    } catch (err) {
      console.error("Erreur suivi utilisateur :", err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        <div className="animate-pulse">Chargement des utilisateurs...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Les utilisateurs inscrits
      </h1>

      {users.length === 0 ? (
        <p className="text-center text-gray-500">
          Aucun utilisateur inscrit pour le moment.
        </p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left text-sm font-semibold text-gray-700">
                <th className="px-4 py-3 border-b">Photo</th>
                <th className="px-4 py-3 border-b">Nom complet</th>
                <th className="px-4 py-3 border-b">Email</th>
                <th className="px-4 py-3 border-b">Date d’inscription</th>
                <th className="px-4 py-3 border-b">Suivre</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors border-b">
                  <td className="px-4 py-3">
                    {u.photoURL ? (
                      <img
                        src={u.photoURL}
                        alt={u.fullName || u.email}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                        {u.fullName?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {u.fullName || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 text-gray-500 text-sm">
                    {u.createdAt
                      ? new Date(u.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {u.id === user?.uid ? (
                      <span className="text-gray-400 italic">C’est toi</span>
                    ) : (
                      <button
                        onClick={() => toggleFollow(u)}
                        className={`px-3 py-1 rounded text-white ${
                          u.followers?.includes(user?.uid)
                            ? "bg-gray-500 hover:bg-gray-600"
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
                      >
                        {u.followers?.includes(user?.uid) ? "Suivi" : "Suivre"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}