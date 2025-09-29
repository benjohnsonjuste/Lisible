"use client"; // permet l'utilisation côté client et des hooks React

import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

export default function LisibleClubViewer() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    // 🔹 On crée une query Firestore pour récupérer les posts triés par date décroissante
    const q = query(collection(db, "clubPosts"), orderBy("createdAt", "desc"));

    // 🔹 On s'abonne aux changements en temps réel
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          createdAt: d.createdAt?.toDate?.() || new Date(), // conversion timestamp -> Date
        };
      });
      setPosts(data);
    });

    return () => unsubscribe(); // clean-up lors du démontage du composant
  }, []);

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-6">
      <h2 className="text-2xl font-bold mb-4">Lisible Club</h2>

      {posts.length === 0 && <p className="text-gray-500">Aucune publication pour l'instant.</p>}

      {posts.map((post) => (
        <div key={post.id} className="p-4 border rounded-xl bg-white shadow relative">
          <h3 className="font-semibold text-lg mb-2">{post.authorName}</h3>
          {post.description && <p className="text-gray-700 mb-3">{post.description}</p>}

          {post.type === "text" && <p className="whitespace-pre-line">{post.content}</p>}

          {post.type === "image" && (
            <img src={post.content} alt="Publication" className="w-full rounded-lg" />
          )}

          {post.type === "video" && (
            <video controls className="w-full rounded-lg">
              <source src={post.content} type="video/mp4" />
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
          )}

          {post.type === "audio" && (
            <audio controls className="w-full">
              <source src={post.content} type="audio/mpeg" />
              Votre navigateur ne supporte pas la lecture audio.
            </audio>
          )}

          {/* Direct vidéo */}
          {post.type === "live_video" && post.isLive && (
            <>
              <video controls autoPlay className="w-full rounded-lg border-2 border-red-500">
                <source src={post.content} type="video/mp4" />
                Votre navigateur ne supporte pas la lecture vidéo en direct.
              </video>
              <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                EN DIRECT
              </span>
            </>
          )}

          {/* Direct audio */}
          {post.type === "live_audio" && post.isLive && (
            <>
              <audio controls autoPlay className="w-full">
                <source src={post.content} type="audio/mpeg" />
                Votre navigateur ne supporte pas la lecture audio en direct.
              </audio>
              <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                EN DIRECT
              </span>
            </>
          )}

          <div className="text-sm text-gray-500 mt-2">
            Publié le {post.createdAt.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}