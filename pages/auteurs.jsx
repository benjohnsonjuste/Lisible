"use client";

import { useEffect, useState } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import { toast } from "sonner";

export default function AuteursPage() {
  const { data: session } = useSession(); // utilisateur connecté
  const [users, setUsers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setUsers(data);
      } catch (err) {
        console.error("Erreur de chargement:", err);
        toast.error("Impossible de charger les auteurs.");
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  // 🔹 Fonction pour suivre/désuivre via GitHub
  const handleFollow = async (authorId) => {
    if (!session?.user) {
      toast.error("Connecte-toi pour suivre un auteur !");
      return;
    }

    const isFollowing = following.includes(authorId);
    setFollowing((prev) =>
      isFollowing ? prev.filter((id) => id !== authorId) : [...prev, authorId]
    );

    try {
      const res = await fetch("/api/follow-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorId,
          followerId: session.user.id || session.user.email,
          followerName: session.user.name,
          followerEmail: session.user.email,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(
        json.isFollowing
          ? "✅ Vous suivez maintenant cet auteur !"
          : "🚫 Vous ne suivez plus cet auteur."
      );
    } catch (err) {
      console.error("Erreur abonnement:", err);
      toast.error("Erreur lors de la mise à jour de l’abonnement.");
    }
  };

  if (loading)
    return <p className="text-center mt-10 text-gray-600">Chargement...</p>;

  if (users.length === 0)
    return (
      <p className="text-center mt-10 text-gray-600">
        Aucun auteur inscrit pour le moment.
      </p>
    );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">✍️ Auteurs Lisible</h1>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => {
            const isFollowing = following.includes(user.id);
            return (
              <div
                key={user.id}
                className="bg-white rounded-xl shadow-md flex flex-col items-center p-6 hover:shadow-lg transition"
              >
                <img
                  src={user.photoURL || "/avatar.png"}
                  alt={user.name || user.email}
                  className="w-24 h-24 rounded-full object-cover mb-4 border"
                />
                <h2 className="text-lg font-semibold mb-1 text-center">
                  {user.name || user.email}
                </h2>

                <button
                  onClick={() => handleFollow(user.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
                    isFollowing
                      ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                      : "bg-transparent text-blue-600 border-blue-600 hover:bg-blue-50"
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck size={18} /> Abonné
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} /> Suivre
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}