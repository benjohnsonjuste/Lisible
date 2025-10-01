"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebaseConfig";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { Heart, MessageCircle, Eye } from "lucide-react";

export default function ClubViewer() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "clubPosts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPosts(data);
    });
    return () => unsubscribe();
  }, []);

  const handleLike = async (post) => {
    if (!auth.currentUser) return alert("Connectez-vous pour liker");
    if (post.likedBy?.includes(auth.currentUser.uid)) return;

    const postRef = doc(db, "clubPosts", post.id);
    await updateDoc(postRef, {
      likes: (post.likes || 0) + 1,
      likedBy: arrayUnion(auth.currentUser.uid),
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {posts.map((post) => (
        <div key={post.id} className="p-4 border rounded-lg shadow">
          <p className="text-gray-500 mb-1">
            {post.authorName} - {post.createdAt?.toDate().toLocaleString()}
          </p>

          {post.type === "text" && <p>{post.content}</p>}
          {post.type === "image" && <img src={post.mediaUrl} alt="" className="rounded-lg mt-2" />}
          {post.type === "video" && (
            <video controls src={post.mediaUrl} className="rounded-lg mt-2" />
          )}
          {post.type === "audio" && (
            <audio controls className="mt-2">
              <source src={post.mediaUrl} />
            </audio>
          )}

          <div className="flex items-center space-x-4 mt-2">
            <button onClick={() => handleLike(post)} className="flex items-center gap-1">
              <Heart size={18} className="text-red-500" />
              {post.likes || 0}
            </button>

            <div className="flex items-center gap-1">
              <Eye size={18} /> {post.views || 0}
            </div>

            <div className="flex items-center gap-1">
              <MessageCircle size={18} /> {post.comments?.length || 0}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}