import { useEffect, useState } from "react";
import LisibleClubDashbord from "@/components/LisibleClubDashboard";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  doc,
  increment,
  arrayUnion,
} from "firebase/firestore";

import { Heart, Eye, MessageSquare } from "lucide-react";

export default function LisibleClub() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({ type: "text", content: "", url: "" });
  const [commentText, setCommentText] = useState({});
  const userId = "demoUser"; // TODO: remplacer par auth.currentUser.uid
  const userName = "Demo User"; // TODO: remplacer par auth.currentUser.displayName

  // 🔥 Charger les posts en temps réel
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "clubPosts"), (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPosts(docs.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
    });
    return () => unsub();
  }, []);

  // ➕ Publier un post
  const handlePublish = async () => {
    if (!newPost.content && !newPost.url) return;
    await addDoc(collection(db, "clubPosts"), {
      ...newPost,
      authorId: userId,
      authorName: userName,
      createdAt: serverTimestamp(),
      likes: 0,
      likedBy: [],
      views: 0,
    });
    setNewPost({ type: "text", content: "", url: "" });
  };

  // ❤️ Like
  const handleLike = async (post) => {
    if (post.likedBy?.includes(userId)) return;
    const ref = doc(db, "clubPosts", post.id);
    await updateDoc(ref, {
      likes: increment(1),
      likedBy: arrayUnion(userId),
    });
  };

  // 👁️ Vue
  const handleView = async (post) => {
    const ref = doc(db, "clubPosts", post.id);
    await updateDoc(ref, {
      views: increment(1),
    });
  };

  // 💬 Commentaire
  const handleComment = async (postId) => {
    if (!commentText[postId]) return;
    await addDoc(collection(db, "clubPosts", postId, "comments"), {
      text: commentText[postId],
      authorId: userId,
      authorName: userName,
      createdAt: serverTimestamp(),
    });
    setCommentText({ ...commentText, [postId]: "" });
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">📚 Lisible Club</h1>

      {/* PublisPost */}
      <div className="p-4 border rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Créer une publication</h2>
        <select
          value={newPost.type}
          onChange={(e) => setNewPost({ ...newPost, type: e.target.value })}
          className="border p-2 rounded mb-2"
        >
          <option value="text">Texte</option>
          <option value="image">Image</option>
          <option value="video">Vidéo</option>
          <option value="audio">Audio</option>
        </select>

        <textarea
          placeholder="Votre contenu..."
          value={newPost.content}
          onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
          className="w-full border p-2 rounded mb-2"
        />

        <input
          type="text"
          placeholder="URL média (optionnel)"
          value={newPost.url}
          onChange={(e) => setNewPost({ ...newPost, url: e.target.value })}
          className="w-full border p-2 rounded mb-2"
        />

        <button
          onClick={handlePublish}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Publier
        </button>
      </div>

      {/* AllPostsViewer */}
      <div className="space-y-4">
        {posts.map((post) => (
          <div
            key={post.id}
            onClick={() => handleView(post)}
            className="p-4 border rounded-lg shadow hover:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">{post.authorName}</span>
              <span className="text-sm text-gray-500">{post.type}</span>
            </div>
            <p className="mt-2">{post.content}</p>
            {post.url && post.type === "image" && (
              <img src={post.url} alt="media" className="mt-2 rounded" />
            )}
            {post.url && post.type === "video" && (
              <video src={post.url} controls className="mt-2 rounded" />
            )}
            {post.url && post.type === "audio" && (
              <audio src={post.url} controls className="mt-2" />
            )}

            {/* Actions */}
            <div className="flex space-x-4 mt-3">
              <button
                onClick={() => handleLike(post)}
                className="flex items-center space-x-1 text-red-500"
              >
                <Heart size={18} />
                <span>{post.likes || 0}</span>
              </button>
              <div className="flex items-center space-x-1 text-blue-500">
                <Eye size={18} />
                <span>{post.views || 0}</span>
              </div>
              <div className="flex items-center space-x-1 text-green-500">
                <MessageSquare size={18} />
                <span>Commentaires</span>
              </div>
            </div>

            {/* Champ commentaire */}
            <div className="mt-2">
              <input
                type="text"
                placeholder="Écrire un commentaire..."
                value={commentText[post.id] || ""}
                onChange={(e) =>
                  setCommentText({ ...commentText, [post.id]: e.target.value })
                }
                className="border p-2 rounded w-full"
              />
              <button
                onClick={() => handleComment(post.id)}
                className="px-3 py-1 bg-gray-800 text-white rounded mt-1"
              >
                Commenter
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
