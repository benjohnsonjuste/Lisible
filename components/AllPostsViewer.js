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
  serverTimestamp,
} from "firebase/firestore";
import { Heart, MessageCircle, Eye } from "lucide-react";

export default function AllPostsViewer() {
  const [posts, setPosts] = useState([]);
  const [newComments, setNewComments] = useState({});

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

  const handleAddComment = async (post) => {
    if (!auth.currentUser) return alert("Connectez-vous pour commenter");
    const commentText = newComments[post.id];
    if (!commentText) return;

    const postRef = doc(db, "clubPosts", post.id);
    await updateDoc(postRef, {
      comments: arrayUnion({
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || "Anonyme",
        text: commentText,
        createdAt: serverTimestamp(),
      }),
    });

    setNewComments({ ...newComments, [post.id]: "" });
  };

  const handleView = async (post) => {
    const postRef = doc(db, "clubPosts", post.id);
    await updateDoc(postRef, {
      views: (post.views || 0) + 1,
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-6">
      {posts.map((post) => (
        <div key={post.id} className="p-4 border rounded-lg shadow">
          <p className="text-gray-500 mb-1">
            {post.authorName} - {post.createdAt?.toDate?.().toLocaleString() || "Just now"}
          </p>

          {/* Contenu */}
          {post.type === "text" && <p>{post.content}</p>}
          {["image", "video", "audio"].includes(post.type) && post.mediaUrl && (
            <>
              {post.type === "image" && (
                <img
                  src={post.mediaUrl}
                  alt={post.content || "image"}
                  className="rounded-lg mt-2"
                  onClick={() => handleView(post)}
                />
              )}
              {post.type === "video" && (
                <video
                  controls
                  src={post.mediaUrl}
                  className="rounded-lg mt-2"
                  onClick={() => handleView(post)}
                />
              )}
              {post.type === "audio" && (
                <audio controls className="mt-2" onPlay={() => handleView(post)}>
                  <source src={post.mediaUrl} />
                </audio>
              )}
            </>
          )}

          {/* Statistiques */}
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

          {/* Commentaires */}
          <div className="mt-2 space-y-1">
            {post.comments?.map((comment, index) => (
              <p key={index} className="text-gray-700 text-sm">
                <strong>{comment.authorName}:</strong> {comment.text}
              </p>
            ))}
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                placeholder="Ajouter un commentaire..."
                className="border p-1 rounded flex-1"
                value={newComments[post.id] || ""}
                onChange={(e) =>
                  setNewComments({ ...newComments, [post.id]: e.target.value })
                }
              />
              <button
                className="bg-blue-600 text-white px-3 py-1 rounded"
                onClick={() => handleAddComment(post)}
              >
                Publier
              </button>
            </div>
          </div>
        </div>
      ))}

      {posts.length === 0 && (
        <p className="text-center text-gray-500">Aucune publication pour le moment.</p>
      )}
    </div>
  );
}