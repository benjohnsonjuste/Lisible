"use client";

import { useEffect, useState } from "react";
import { db, storage, auth } from "@/lib/firebaseConfig";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  doc,
  arrayUnion
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";

export default function ClubViewer() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [type, setType] = useState("text");
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState("");

  // 🔹 Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 🔹 Posts listener
  useEffect(() => {
    const q = query(collection(db, "clubPosts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, snapshot => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // 🔹 Publier
  const handlePublish = async (e) => {
    e.preventDefault();
    if (!user) return alert("Connectez-vous pour publier.");
    if (!content.trim() && !file) return alert("Ajoutez du contenu ou un fichier.");

    setLoading(true);
    try {
      let url = null;
      if (file) {
        const storageRef = ref(storage, `clubPosts/${user.uid}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        url = await new Promise((resolve, reject) => {
          uploadTask.on("state_changed", null, reject, async () => {
            resolve(await getDownloadURL(uploadTask.snapshot.ref));
          });
        });
      }

      await addDoc(collection(db, "clubPosts"), {
        authorId: user.uid,
        authorName: user.displayName || "Anonyme",
        content: content || null,
        url: url || null,
        type,
        likes: 0,
        views: 0,
        likedBy: [],
        comments: [],
        createdAt: serverTimestamp()
      });

      setContent("");
      setFile(null);
      setType("text");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la publication.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Like
  const handleLike = async (post) => {
    if (!user) return alert("Connectez-vous pour liker.");
    if (post.likedBy?.includes(user.uid)) return;
    const postRef = doc(db, "clubPosts", post.id);
    await updateDoc(postRef, {
      likes: post.likes + 1,
      likedBy: arrayUnion(user.uid)
    });
  };

  // 🔹 Commenter
  const handleComment = async (post) => {
    if (!user) return alert("Connectez-vous pour commenter.");
    if (!commentText.trim()) return;

    const postRef = doc(db, "clubPosts", post.id);
    await updateDoc(postRef, {
      comments: arrayUnion({
        text: commentText,
        authorId: user.uid,
        authorName: user.displayName || "Anonyme",
        createdAt: serverTimestamp()
      })
    });
    setCommentText("");
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Lisible Club</h1>

      {user && (
        <form onSubmit={handlePublish} className="p-4 border rounded-lg space-y-2">
          <textarea
            placeholder="Écrivez un texte..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-2 border rounded-md"
          />
          <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="p-2 border rounded-md"
          >
            <option value="text">Texte</option>
            <option value="image">Image</option>
            <option value="video">Vidéo</option>
            <option value="audio">Audio</option>
            <option value="live_video">Direct Vidéo</option>
            <option value="live_audio">Direct Audio</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            {loading ? "Publication en cours..." : "Publier"}
          </button>
        </form>
      )}

      {posts.map((post) => (
        <div key={post.id} className="p-4 border rounded-lg shadow space-y-2">
          <p className="text-gray-500">par {post.authorName}</p>
          {post.type === "text" && <p>{post.content}</p>}
          {post.type === "image" && <img src={post.url} alt="Image" className="rounded-lg" />}
          {post.type === "video" && <video controls src={post.url} className="rounded-lg" />}
          {post.type === "audio" && <audio controls src={post.url} />}
          
          <div className="flex items-center space-x-4">
            <button onClick={() => handleLike(post)} className="text-red-500 font-bold">
              ❤️ {post.likes || 0}
            </button>
            <button
              onClick={() => navigator.share?.({ text: post.content || "", url: post.url })}
              className="text-blue-500 font-semibold"
            >
              🔗 Partager
            </button>
          </div>

          {/* Commentaires */}
          <div className="space-y-2">
            {post.comments?.map((c, idx) => (
              <p key={idx} className="text-gray-700">
                <span className="font-semibold">{c.authorName}:</span> {c.text}
              </p>
            ))}
            {user && (
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Commenter..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 border p-2 rounded-md"
                />
                <button
                  onClick={() => handleComment(post)}
                  className="bg-green-500 text-white px-3 rounded-md"
                >
                  Envoyer
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      {posts.length === 0 && <p className="text-center text-gray-500">Aucun post pour le moment.</p>}
    </div>
  );
}