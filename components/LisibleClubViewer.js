"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

export default function ClubViewer() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    // 🔹 Récupération des posts du club
    const q = query(collection(db, "clubPosts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPosts(data);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Lisible Club Viewer</h1>
      {posts.map((post) => (
        <div key={post.id} className="p-4 border rounded-lg shadow">
          <p className="text-gray-500">par {post.authorName || "Anonyme"}</p>
          {post.type === "text" && <p>{post.content}</p>}
          {post.type === "image" && (
            <img src={post.url} alt="Publication" className="rounded-lg mt-2" />
          )}
          {post.type === "video" && (
            <video controls src={post.url} className="rounded-lg mt-2" />
          )}
        </div>
      ))}
      {posts.length === 0 && (
        <p className="text-center text-gray-500">Aucun post pour le moment.</p>
      )}
    </div>
  );
}