"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { db } from "@/firebase";
import { doc, getDoc, setDoc, updateDoc, increment, onSnapshot } from "firebase/firestore";
import { useSession } from "next-auth/react";

export default function TextDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [views, setViews] = useState(0);
  const [likes, setLikes] = useState(0);

  // Charger le contenu du texte (depuis le dossier public/data/texts)
  useEffect(() => {
    if (!id) return;
    const fetchText = async () => {
      try {
        const res = await fetch(`/data/texts/${id}.json`);
        if (!res.ok) throw new Error("Texte introuvable");
        const data = await res.json();
        setText(data);
      } catch (err) {
        console.error("❌ Erreur chargement texte :", err);
        toast.error("Impossible de charger le texte");
      } finally {
        setLoading(false);
      }
    };
    fetchText();
  }, [id]);

  // 🔁 Charger les vues et likes depuis Firestore en temps réel
  useEffect(() => {
    if (!id) return;
    const ref = doc(db, "textsMeta", id);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data();
      setViews(data?.views || 0);
      setLikes(data?.likes || 0);
    });
    return () => unsub();
  }, [id]);

  // 👁️ Incrémenter le compteur de vues à chaque ouverture
  useEffect(() => {
    if (!id) return;
    const ref = doc(db, "textsMeta", id);
    const incrementView = async () => {
      try {
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await setDoc(ref, { views: 1, likes: 0 });
        } else {
          await updateDoc(ref, { views: increment(1) });
        }
      } catch (err) {
        console.warn("Erreur enregistrement vue :", err);
      }
    };
    incrementView();
  }, [id]);

  // ❤️ Gérer le Like
  const handleLike = async () => {
    if (!session) {
      toast.info("Connecte-toi pour aimer un texte !");
      router.push(`/login?redirect=/texts/${id}`);
      return;
    }

    try {
      const ref = doc(db, "textsMeta", id);
      await updateDoc(ref, { likes: increment(1) });
      toast.success("Tu as aimé ce texte ❤️");
    } catch (err) {
      console.error("Erreur lors du Like :", err);
      toast.error("Impossible d'ajouter ton like");
    }
  };

  // 💬 Gérer le clic sur Commenter
  const handleComment = () => {
    if (!session) {
      toast.info("Connecte-toi pour commenter !");
      router.push(`/login?redirect=/texts/${id}`);
      return;
    }
    toast("Fonction commentaire à venir 💬");
  };

  if (loading) {
    return <div className="text-center py-10 text-gray-600">Chargement...</div>;
  }

  if (!text) {
    return (
      <div className="text-center py-10 text-gray-600">
        Texte introuvable ou supprimé.
      </div>
    );
  }

  const formattedDate = text.date
    ? new Date(text.date).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Date inconnue";

  const authorName = text.authorName || "Auteur inconnu";

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded-xl">
      {text.image && (
        <img
          src={text.image}
          alt={text.title}
          className="w-full h-64 object-cover rounded-lg mb-4"
        />
      )}

      <h1 className="text-3xl font-bold mb-2">{text.title}</h1>
      <p className="text-gray-500 mb-4">
        ✍️ {authorName} | 🗓 {formattedDate}
      </p>

      <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
        <span>👁️ {views} vues</span>
        <span>👍 {likes} likes</span>
      </div>

      <div className="text-lg leading-relaxed whitespace-pre-wrap mb-6">
        {text.content || "Aucun contenu disponible."}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleLike}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          👍 Aimer
        </button>
        <button
          onClick={handleComment}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          💬 Commenter
        </button>
        <button
          onClick={() => {
            navigator.share
              ? navigator.share({
                  title: text.title,
                  text: `Lis ce texte sur Lisible : ${text.title}`,
                  url: window.location.href,
                })
              : toast.info("Partage non supporté sur ce navigateur");
          }}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          🔗 Partager
        </button>
      </div>

      <div className="mt-8 text-center">
        <Link href="/library" className="text-blue-600 hover:underline">
          ← Retour à la bibliothèque
        </Link>
      </div>
    </div>
  );
}