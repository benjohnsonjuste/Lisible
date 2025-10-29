"use client";

import { useState, useEffect } from "react";
import { UserPlus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/hooks/useUserProfile"; // ✅ Hook personnalisé
import { toast } from "sonner";

export default function AuteursPage() {
  const { user, loading } = useUserProfile(); // ✅ Données utilisateur
  const [authors, setAuthors] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followersCount, setFollowersCount] = useState({});
  const router = useRouter();

  // 🔹 Récupération des auteurs
  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        const res = await fetch("/api/get-authors");
        const data = await res.json();
        setAuthors(data);

        // Charger compteurs d'abonnés
        data.forEach(async (author) => {
          const resCount = await fetch(
            `/api/get-followers-count?authorId=${author.uid}`
          );
          const json = await resCount.json();
          setFollowersCount((prev) => ({
            ...prev,
            [author.uid]: json.followersCount || 0,
          }));
        });
      } catch (err) {
        console.error("Erreur récupération auteurs :", err);
      }
    };
    fetchAuthors();
  }, []);

  // 🔹 Suivre / Se désabonner d’un auteur
  const toggleFollow = async (author) => {
    if (loading) return toast("Chargement du profil...");
    if (!user) {
      toast.warning("Connectez-vous pour suivre un auteur.");
      router.push("/auth-dialog"); // 🔁 Redirection vers AuthDialog
      return;
    }

    try {
      const res = await fetch("/api/toggle-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ follower: user, author }),
      });
      const data = await res.json();

      if (data.success) {
        setFollowing((prev) =>
          data.isFollowing
            ? [...prev, author.uid]
            : prev.filter((id) => id !== author.uid)
        );
        setFollowersCount((prev) => ({
          ...prev,
          [author.uid]: data.followersCount,
        }));
      } else {
        toast.error("Erreur : impossible de mettre à jour l’abonnement.");
      }
    } catch (err) {
      console.error("Erreur toggleFollow:", err);
      toast.error("Erreur lors de l’abonnement.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <h1 className="text-3xl font-bold text-center mb-8">Auteurs Lisible</h1>

      {/* 🔹 Liste d’auteurs */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {authors.map((author) => {
          const isFollowing = following.includes(author.uid);
          const count = followersCount[author.uid] || 0;

          return (
            <div
              key={author.uid}
              className="bg-white rounded-xl shadow p-5 flex flex-col items-center space-y-3 hover:shadow-lg transition"
            >
              <img
                src={author.photoURL || "/avatar.png"}
                alt={author.displayName || author.email}
                className="w-20 h-20 rounded-full object-cover"
              />

              <h3 className="font-semibold text-center">
                {author.displayName || author.email}
              </h3>

              <button
                onClick={() => toggleFollow(author)}
                className="mt-2 transition"
                title={isFollowing ? "Se désabonner" : "Suivre"}
              >
                <UserPlus
                  size={24}
                  className={`${
                    isFollowing ? "text-blue-600" : "text-gray-400"
                  } transition`}
                  fill={isFollowing ? "currentColor" : "none"}
                />
              </button>

              <div className="flex items-center gap-1 text-gray-600 text-sm mt-1">
                <Users size={16} />
                <span>{count}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}