"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

export default function AuteurPage() {
  const router = useRouter();
  const { id } = router.query; // id auteur
  const { data: session } = useSession();
  const [author, setAuthor] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [texts, setTexts] = useState([]);

  // 🔹 Récupère infos auteur depuis Firestore
  useEffect(() => {
    if (!id) return;
    async function fetchAuthor() {
      try {
        const docSnap = await getDoc(doc(db, "users", id));
        if (docSnap.exists()) {
          setAuthor({ id: docSnap.id, ...docSnap.data() });
        } else {
          toast.error("Auteur introuvable.");
          router.push("/auteurs");
        }
      } catch (err) {
        console.error(err);
        toast.error("Erreur lors du chargement de l'auteur.");
      }
    }
    fetchAuthor();
  }, [id]);

  // 🔹 Récupère les abonnés depuis GitHub
  useEffect(() => {
    if (!id) return;
    async function fetchSubscribers() {
      try {
        const res = await fetch(`/api/get-subscribers?id=${id}`);
        const data = await res.json();
        if (res.ok) {
          setSubscribers(data.subscribers || []);
          if (session?.user) {
            const found = data.subscribers.some(
              (s) => s.id === (session.user.id || session.user.email)
            );
            setIsFollowing(found);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchSubscribers();
  }, [id, session]);

  // 🔹 Récupère les textes de cet auteur
  useEffect(() => {
    if (!id) return;
    async function fetchTexts() {
      const q = query(collection(db, "texts"), where("authorId", "==", id));
      const snapshot = await getDocs(q);
      setTexts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    }
    fetchTexts();
  }, [id]);

  // 🔹 Suivre / désabonner l’auteur via GitHub
  const handleFollow = async () => {
    if (!session?.user) {
      toast.error("Connecte-toi pour suivre un auteur !");
      return;
    }
    try {
      const res = await fetch("/api/follow-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorId: id,
          followerId: session.user.id || session.user.email,
          followerName: session.user.name,
          followerEmail: session.user.email,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setIsFollowing(json.isFollowing);
      setSubscribersCount(json.subscribersCount || subscribers.length);
      toast.success(
        json.isFollowing
          ? "✅ Vous suivez maintenant cet auteur."
          : "🚫 Vous ne suivez plus cet auteur."
      );
    } catch (err) {
      console.error("Erreur abonnement:", err);
      toast.error("Impossible de mettre à jour l’abonnement.");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin text-gray-500 w-6 h-6" />
      </div>
    );

  if (!author)
    return (
      <div className="text-center mt-20 text-gray-600">
        Auteur introuvable.
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      {/* Profil auteur */}
      <div className="flex flex-col items-center text-center mb-10">
        <img
          src={author.photoURL || "/avatar.png"}
          alt={author.name}
          className="w-32 h-32 rounded-full object-cover mb-4 border"
        />
        <h1 className="text-2xl font-bold">{author.name}</h1>
        <p className="text-gray-600 mb-4">{author.bio || "Aucune bio disponible."}</p>

        {/* Bouton suivre */}
        <button
          onClick={handleFollow}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg border transition ${
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

      {/* Liste d'abonnés */}
      <div className="bg-white rounded-xl shadow p-6 mb-10">
        <h2 className="text-lg font-semibold mb-4">
          👥 {subscribers.length} abonné{subscribers.length > 1 ? "s" : ""}
        </h2>
        {subscribers.length === 0 ? (
          <p className="text-gray-500">Aucun abonné pour le moment.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {subscribers.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50"
              >
                <img
                  src="/avatar.png"
                  className="w-8 h-8 rounded-full border"
                  alt=""
                />
                <span className="text-gray-800">{s.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Textes de l’auteur */}
      <div>
        <h2 className="text-lg font-semibold mb-4">📝 Textes publiés</h2>
        {texts.length === 0 ? (
          <p className="text-gray-500">Aucun texte publié.</p>
        ) : (
          <ul className="space-y-3">
            {texts.map((t) => (
              <li
                key={t.id}
                className="p-4 bg-white rounded-lg shadow hover:shadow-md transition"
              >
                <h3 className="font-semibold text-lg">{t.title}</h3>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {t.content?.slice(0, 150)}...
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}