"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebaseConfig";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  increment
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Heart } from "lucide-react";

export default function LisibleClubViewer() {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "clubPosts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => {
        const item = d.data();
        return {
          id: d.id,
          ...item,
          // convert createdAt if necessary for display
          createdAt: item.createdAt?.toDate ? item.createdAt.toDate() : null,
        };
      });
      setPosts(data);
    });

    return () => unsub();
  }, []);

  const handleLike = async (post) => {
    if (!user) {
      alert("Veuillez vous connecter pour aimer une publication.");
      return;
    }
    const likedBy = Array.isArray(post.likedBy) ? post.likedBy : [];
    if (likedBy.includes(user.uid)) {
      alert("Vous avez déjà aimé cette publication.");
      return;
    }

    try {
      const ref = doc(db, "clubPosts", post.id);
      await updateDoc(ref, {
        likes: increment(1),
        likedBy: arrayUnion(user.uid),
      });

      // mise à jour locale immédiate (optimistic)
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? { ...p, likes: (p.likes || 0) + 1, likedBy: [...likedBy, user.uid] }
            : p
        )
      );
    } catch (err) {
      console.error("Erreur like :", err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Lisible Club</h1>

      {posts.length === 0 && (
        <p className="text-center text-gray-500">Aucun post pour le moment.</p>
      )}

      {posts.map((post) => (
        <article key={post.id} className="p-4 border rounded-lg shadow space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{post.authorName || "Anonyme"}</h3>
              <div className="text-sm text-gray-500">
                {post.createdAt ? post.createdAt.toLocaleString() : ""}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleLike(post)}
                disabled={post.likedBy?.includes(user?.uid)}
                title={post.likedBy?.includes(user?.uid) ? "Vous avez déjà aimé" : "J'aime"}
                className={`flex items-center gap-1 ${
                  post.likedBy?.includes(user?.uid) ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                <Heart className="w-5 h-5 text-red-500" />
                <span className="text-sm">{post.likes || 0}</span>
              </button>
            </div>
          </div>

          {post.description && <p className="text-gray-700">{post.description}</p>}

          {/* Contenu selon le type */}
          {post.type === "text" && (
            <p className="whitespace-pre-line">{post.content}</p>
          )}

          {post.type === "image" && post.content && (
            <img src={post.content} alt="Publication" className="w-full rounded-lg" />
          )}

          {post.type === "video" && post.content && (
            <video controls className="w-full rounded-lg">
              <source src={post.content} type="video/mp4" />
              Votre navigateur ne supporte pas la vidéo.
            </video>
          )}

          {post.type === "audio" && post.content && (
            <audio controls className="w-full">
              <source src={post.content} type="audio/mpeg" />
            </audio>
          )}

          {/* Si isLive true on peut afficher badge EN DIRECT */}
          {post.isLive && (
            <div className="inline-block px-2 py-1 bg-red-600 text-white rounded text-xs">
              EN DIRECT
            </div>
          )}
        </article>
      ))}
    </div>
  );
}