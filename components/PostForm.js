"use client";

import { useState } from "react";
import { db, auth } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ArrowUp, Image, Video, MessageCircle, Mic } from "lucide-react";

export default function PostForm({ onPostSuccess }) {
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [type, setType] = useState("text");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e, newType) => {
    setFile(e.target.files[0]);
    setType(newType);
  };

  const uploadToDrive = async (file) => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onloadend = async () => {
        try {
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
          resolve(data.url);
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return alert("Connectez-vous pour publier");
    setLoading(true);

    let mediaUrl = null;
    if (file) mediaUrl = await uploadToDrive(file);

    const postData = {
      authorId: auth.currentUser.uid,
      authorName: auth.currentUser.displayName || "Anonyme",
      type,
      content: content || "",
      mediaUrl: mediaUrl || "",
      createdAt: serverTimestamp(),
      likes: 0,
      likedBy: [],
      views: 0,
      comments: [],
    };

    try {
      await addDoc(collection(db, "clubPosts"), postData);
      setContent("");
      setFile(null);
      setType("text");
      onPostSuccess && onPostSuccess();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la publication");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded-lg mb-6">
      <textarea
        className="w-full border p-2 rounded mb-2"
        placeholder="Écrivez quelque chose..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <div className="flex items-center space-x-2 mb-2">
        <label className="cursor-pointer flex items-center gap-1">
          <Image size={20} />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileChange(e, "image")}
          />
        </label>

        <label className="cursor-pointer flex items-center gap-1">
          <Video size={20} />
          <input
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => handleFileChange(e, "video")}
          />
        </label>

        <label className="cursor-pointer flex items-center gap-1">
          <Mic size={20} />
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => handleFileChange(e, "audio")}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
      >
        <ArrowUp size={16} />
        {loading ? "Publication..." : "Publier"}
      </button>
    </form>
  );
}