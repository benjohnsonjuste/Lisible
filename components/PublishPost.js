"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { FileText, Image, Video, Mic } from "lucide-react";

export default function PublishPost() {
  const [type, setType] = useState("text");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!auth.currentUser) return <p>Connectez-vous pour publier</p>;

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handlePublish = async () => {
    if (!auth.currentUser) return alert("Vous devez être connecté");
    setLoading(true);

    try {
      let mediaUrl = null;

      if (file) {
        // 🔹 Upload sur Google Drive via API interne
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result.split(",")[1];

          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: file.name,
              mimeType: file.type,
              base64,
            }),
          });

          const data = await res.json();
          mediaUrl = data.url;

          await savePost(mediaUrl);
        };
        reader.readAsDataURL(file);
      } else {
        await savePost(null);
      }
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la publication");
      setLoading(false);
    }
  };

  const savePost = async (mediaUrl) => {
    await addDoc(collection(db, "clubPosts"), {
      authorId: auth.currentUser.uid,
      authorName: auth.currentUser.displayName || "Anonyme",
      type,
      content: type === "text" ? content : "",
      mediaUrl,
      likes: 0,
      views: 0,
      likedBy: [],
      comments: [],
      createdAt: serverTimestamp(),
    });

    setContent("");
    setFile(null);
    setLoading(false);
    alert("Publication réussie !");
  };

  return (
    <div className="max-w-2xl mx-auto p-6 border rounded-lg shadow space-y-4">
      <h2 className="text-xl font-bold">Publier dans Lisible Club</h2>

      <div className="flex gap-2">
        <button onClick={() => setType("text")} className="flex items-center gap-1">
          <FileText size={18} /> Texte
        </button>
        <button onClick={() => setType("image")} className="flex items-center gap-1">
          <Image size={18} /> Image
        </button>
        <button onClick={() => setType("video")} className="flex items-center gap-1">
          <Video size={18} /> Vidéo
        </button>
        <button onClick={() => setType("audio")} className="flex items-center gap-1">
          <Mic size={18} /> Audio
        </button>
      </div>

      {type === "text" && (
        <textarea
          className="w-full border p-2 rounded"
          rows={4}
          placeholder="Votre texte..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      )}

      {type !== "text" && (
        <input type="file" accept={`${type}/*`} onChange={handleFileChange} />
      )}

      <button
        onClick={handlePublish}
        disabled={loading || (!content && !file)}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Publication..." : "Publier"}
      </button>
    </div>
  );
}