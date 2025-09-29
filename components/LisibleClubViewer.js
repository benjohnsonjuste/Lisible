import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

export default function LisibleClubViewer() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "clubPosts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Lisible Club</h2>

      {posts.map((post) => (
        <div key={post.id} className="p-4 border rounded-xl bg-white shadow">
          <h3 className="font-semibold text-lg mb-2">{post.authorName}</h3>
          <p className="text-gray-700 mb-3">{post.description}</p>

          {post.type === "text" && (
            <p className="whitespace-pre-line">{post.content}</p>
          )}

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

          {/* 🔹 Direct vidéo */}
          {post.type === "live_video" && post.isLive && (
            <div className="relative">
              <video controls autoPlay className="w-full rounded-lg border-2 border-red-500">
                <source src={post.content} type="video/mp4" />
                Votre navigateur ne supporte pas la lecture vidéo en direct.
              </video>
              <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                EN DIRECT
              </span>
            </div>
          )}

          {/* 🔹 Direct audio */}
          {post.type === "live_audio" && post.isLive && (
            <div className="relative">
              <audio controls autoPlay className="w-full">
                <source src={post.content} type="audio/mpeg" />
                Votre navigateur ne supporte pas la lecture audio en direct.
              </audio>
              <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                EN DIRECT
              </span>
            </div>
          )}

          <div className="text-sm text-gray-500 mt-2">
            Publié le {new Date(post.createdAt?.seconds * 1000).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}