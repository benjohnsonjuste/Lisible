"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/firebase";
import { doc, getDoc, onSnapshot, updateDoc, arrayUnion } from "firebase/firestore";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

export default function TextPage() {
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname.split("/").pop();

  const [text, setText] = useState(null);
  const [views, setViews] = useState(0);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");

  // Charger le texte depuis index.json ou directement depuis GitHub
  useEffect(() => {
    const fetchText = async () => {
      try {
        const res = await fetch(`/data/texts/${id}.json`);
        const json = await res.json();
        setText(json);
      } catch (err) {
        console.error("Erreur chargement du texte :", err);
      }
    };
    fetchText();
  }, [id]);

  // Charger les vues, likes et commentaires depuis Firestore en temps réel
  useEffect(() => {
    if (!id) return;
    const metaRef = doc(db, "textsMeta", id);

    // Abonnement temps réel
    const unsubscribe = onSnapshot(metaRef, (snap) => {
      const data = snap.data();
      setViews(data?.views || 0);
      setLikes(data?.likes || 0);
      setComments(data?.comments || []);
    });

    // Incrémenter les vues (une vue par utilisateur peut être implémentée ici)
    const incrementViews = async () => {
      const docSnap = await getDoc(metaRef);
      if (docSnap.exists()) {
        await updateDoc(metaRef, { views: (docSnap.data().views || 0) + 1 });
      } else {
        await updateDoc(metaRef, { views: 1, likes: 0, comments: [] });
      }
    };
    incrementViews();

    return () => unsubscribe();
  }, [id]);

  const handleLike = async () => {
    const metaRef = doc(db, "textsMeta", id);
    await updateDoc(metaRef, { likes: likes + 1 });
  };

  const handleComment = async () => {
    if (!commentInput.trim()) return;
    const metaRef = doc(db, "textsMeta", id);
    await updateDoc(metaRef, { comments: arrayUnion(commentInput) });
    setCommentInput("");
    toast.success("Commentaire ajouté !");
  };

  if (!text) return <p>Chargement...</p>;

  const formattedDate = new Date(text.date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow space-y-4">
      {text.image && (
        <img src={text.image} alt={text.title} className="w-full h-64 object-cover rounded" />
      )}
      <h1 className="text-2xl font-bold">{text.title}</h1>
      <p className="text-sm text-gray-500 mb-2">
        ✍️{" "}
        <a href={`/auteur/${text.authorId}`} className="text-blue-600 hover:underline">
          {text.authorName}
        </a>{" "}
        (ID: {text.authorId}) | 🗓 {formattedDate} | 📚 {text.genre}
      </p>
      <p className="whitespace-pre-wrap">{text.content}</p>

      <div className="flex gap-4 mt-4">
        <button
          onClick={handleLike}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          👍 {likes}
        </button>
        <span>👁️ {views}</span>
      </div>

      <div className="mt-6">
        <h2 className="font-semibold mb-2">💬 Commentaires</h2>
        {comments.length === 0 && <p>Aucun commentaire pour le moment.</p>}
        <ul className="space-y-2">
          {comments.map((c, i) => (
            <li key={i} className="p-2 bg-gray-100 rounded">{c}</li>
          ))}
        </ul>

        <div className="mt-4 flex gap-2">
          <input
            type="text"
            placeholder="Ajouter un commentaire..."
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            className="flex-1 p-2 border rounded"
          />
          <button
            onClick={handleComment}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Envoyer
          </button>
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={() => navigator.clipboard.writeText(window.location.href)}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          🔗 Partager le lien
        </button>
      </div>
    </div>
  );
}