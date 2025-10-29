"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

export default function UserProfilePage({ currentUser }) {
  const params = useParams(); // { uid }
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [texts, setTexts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);

  // Charger les infos de l'auteur et ses textes
  useEffect(() => {
    async function fetchUserData() {
      try {
        const res = await fetch(`/api/get-user?uid=${params.uid}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Utilisateur introuvable");

        setUser(json.user);
        setTexts(json.texts || []);

        // Vérifier si currentUser suit déjà cet auteur
        if (currentUser && json.user.subscribers?.includes(currentUser.uid)) {
          setIsFollowing(true);
        }
      } catch (err) {
        console.error(err);
        toast.error("Impossible de charger l'utilisateur");
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [params.uid, currentUser]);

  if (loading) return <p className="text-center mt-10">Chargement...</p>;
  if (!user) return <p className="text-center mt-10">Utilisateur introuvable</p>;

  const handleFollow = async () => {
    if (!currentUser) {
      toast.error("Vous devez être connecté pour suivre cet auteur.");
      return;
    }

    try {
      const res = await fetch("/api/follow-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uidToFollow: user.uid,
          followerUid: currentUser.uid,
          followerName: currentUser.displayName,
          followerEmail: currentUser.email,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Échec de suivi");

      setIsFollowing(true);
      toast.success("✅ Vous suivez maintenant cet auteur !");
    } catch (err) {
      console.error(err);
      toast.error("❌ Impossible de suivre l'auteur");
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      {/* Profil auteur */}
      <div className="bg-white p-6 rounded-xl shadow flex flex-col items-center space-y-4">
        <img
          src={user.profilePic || "/avatar.png"}
          alt={user.authorName || "Auteur"}
          className="w-24 h-24 rounded-full object-cover border"
        />
        <h1 className="text-2xl font-bold">{user.authorName || "Auteur inconnu"}</h1>
        {user.penName && <p className="text-gray-500">Nom de plume: {user.penName}</p>}
        {user.paymentMethod && (
          <p className="text-sm text-gray-600">Mode de paiement: {user.paymentMethod}</p>
        )}

        {/* Bouton Suivre */}
        <button
          onClick={handleFollow}
          disabled={isFollowing}
          className={`px-4 py-2 rounded ${
            isFollowing
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 transition"
          }`}
        >
          {isFollowing ? "Vous suivez cet auteur" : "Suivre"}
        </button>
      </div>

      {/* Textes publiés */}
      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <h2 className="text-xl font-semibold">Textes publiés ({texts.length})</h2>
        {texts.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucun texte publié pour le moment.</p>
        ) : (
          <ul className="space-y-2">
            {texts.map((t) => (
              <li key={t.id} className="p-3 border rounded hover:bg-gray-50 transition">
                <a href={`/text/${t.id}`} className="font-semibold text-blue-600 hover:underline">
                  {t.title}
                </a>
                <p className="text-gray-500 text-sm mt-1">{t.createdAt}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
