"use client";

import { useEffect, useState } from "react";
import { db, storage, auth } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";

export default function LisibleClubPublisher({ onNewPost }) {
  const [user, setUser] = useState(null);
  const [type, setType] = useState("text");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileKey, setFileKey] = useState(Date.now());

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const resetForm = () => {
    setType("text");
    setContent("");
    setFile(null);
    setDescription("");
    setFileKey(Date.now());
  };

  const uploadFileAndGetUrl = async (fileToUpload) => {
    if (!fileToUpload) return "";
    // chemin lisible public possible; garder user id pour l'organisation mais régler règles Storage pour read public
    const folder = "clubPosts/media";
    const name = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}_${fileToUpload.name}`;
    const storageRef = ref(storage, `${folder}/${name}`);

    return await new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

      const onError = (error) => {
        reject(error);
      };

      const onComplete = async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(url);
        } catch (err) {
          reject(err);
        }
      };

      uploadTask.on("state_changed", null, onError, onComplete);
    });
  };

  const handlePost = async (e) => {
    e.preventDefault();

    if (!user) {
      alert("Veuillez vous connecter pour publier.");
      return;
    }

    if (type === "text" && !content.trim()) {
      alert("Le texte est vide.");
      return;
    }

    if (type !== "text" && !file) {
      alert("Veuillez sélectionner un fichier à téléverser.");
      return;
    }

    setLoading(true);

    try {
      let mediaUrl = "";

      if (file && type !== "text") {
        mediaUrl = await uploadFileAndGetUrl(file);
      }

      // Capturer les métadonnées d'auteur au moment de la publication
      const authorName = user.displayName || "Auteur inconnu";
      const authorPhotoURL = user.photoURL || "";

      const newPost = {
        authorId: user.uid,
        authorName,
        authorPhotoURL,
        type,
        content: type === "text" ? content.trim() : mediaUrl,
        description: description.trim() || "",
        likes: 0,
        likedBy: [],
        views: 0,
        isLive: false,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "clubPosts"), newPost);

      if (typeof onNewPost === "function") onNewPost();

      resetForm();
      alert("✅ Publication réussie !");
    } catch (err) {
      console.error("Erreur publication Lisible Club :", err);
      alert("Impossible de publier, réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handlePost} className="bg-white p-6 rounded-2xl shadow-lg space-y-4">
      <h2 className="text-xl font-bold">Publier sur Lisible Club</h2>

      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="w-full p-2 border rounded-md"
      >
        <option value="text">Texte</option>
        <option value="image">Image</option>
        <option value="video">Vidéo</option>
        <option value="audio">Audio</option>
      </select>

      {type === "text" ? (
        <textarea
          placeholder="Écrivez votre texte ici..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-2 border rounded-md h-32"
          required
        />
      ) : (
        <input
          key={fileKey}
          type="file"
          accept={type === "image" ? "image/*" : type === "video" ? "video/*" : "audio/*"}
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full p-2 border rounded-md"
          required
        />
      )}

      <input
        type="text"
        placeholder="Légende ou description (facultatif)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full p-2 border rounded-md"
      />

      <button
        type="submit"
        disabled={loading}
        className={`w-full p-2 rounded-lg text-white ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
      >
        {loading ? "Publication..." : "Publier"}
      </button>
    </form>
  );
}