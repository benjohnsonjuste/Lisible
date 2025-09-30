"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebaseConfig";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function LisibleClubViewer() {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);

  // 🔹 Écoute Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 🔹 Récupération des posts en temps réel
  useEffect(() => {
    const q = query(collection(db, "clubPosts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      }));
      setPosts(data);
    });
    return () => unsubscribe();
  }, []);

  // 🔹 Fonction pour liker
  const handleLike = async (post) => {
    if (!user) {
      alert("Veuillez vous connecter pour liker ce post.");
      return;
    }

    const likedByArray = Array.isArray(post.likedBy) ? post.likedBy : [];
    if (likedByArray.includes(user.uid)) {
      alert("Vous avez déjà aimé ce post.");
      return;
    }

    try {
      const postRef = doc(db, "clubPosts", post.id);
      await updateDoc(postRef, {
        likes: (post.likes || 0) + 1,
        likedBy: arrayUnion(user.uid),
      });

      setPosts(prev => prev.map(p => p.id === post.id 
        ? { ...p, likes: (p.likes || 0) + 1, likedBy: [...likedByArray, user.uid] } 
        : p
      ));
    } catch (e) {
      console.error("Erreur lors du like :", e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <h2 className="text-2xl font-bold text-center mb-4">Lisible Club</h2>

      {posts.length === 0 && <p className="text-gray-500 text-center">Aucune publication pour l'instant.</p>}

      {posts.map(post => (
        <div key={post.id} className="bg-white p-4 rounded-xl shadow space-y-2">
          <h3 className="font-semibold">{post.authorName || "Anonyme"}</h3>
          {post.description && <p className="text-gray-700">{post.description}</p>}

          {/* Type texte */}
          {post.type === "text" && <p className="whitespace-pre-line">{post.content}</p>}

          {/* Type image */}
          {post.type === "image" && <img src={post.content} alt="Image post" className="w-full rounded-lg" />}

          {/* Type vidéo */}
          {post.type === "video" && (
            <video controls className="w-full rounded-lg">
              <source src={post.content} type="video/mp4" />
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
          )}

          {/* Type audio */}
          {post.type === "audio" && (
            <audio controls className="w-full">
              <source src={post.content} type="audio/mpeg" />
              Votre navigateur ne supporte pas la lecture audio.
            </audio>
          )}

          {/* Direct vidéo */}
          {post.type === "live_video" && post.isLive && (
            <div className="relative">
              <video controls autoPlay className="w-full rounded-lg border-2 border-red-500">
                <source src={post.content} type="video/mp4" />
                Votre navigateur ne supporte pas la lecture vidéo en direct.
              </video>
              <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">EN DIRECT</span>
            </div>
          )}

          {/* Direct audio */}
          {post.type === "live_audio" && post.isLive && (
            <div className="relative">
              <audio controls autoPlay className="w-full">
                <source src={post.content} type="audio/mpeg" />
                Votre navigateur ne supporte pas la lecture audio en direct.
              </audio>
              <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">EN DIRECT</span>
            </div>
          )}

          {/* Likes */}
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <button
              onClick={() => handleLike(post)}
              disabled={post.likedBy?.includes(user?.uid)}
              className={`flex items-center gap-1 ${post.likedBy?.includes(user?.uid) ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <img src="/like.svg" alt="J'aime" className="w-5 h-5" />
              <span>{post.likes || 0}</span>
            </button>
            <span>{post.views || 0} vues</span>
          </div>

          <div className="text-xs text-gray-400">{post.createdAt.toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}