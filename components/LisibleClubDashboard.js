import { useState } from "react";
import { db, storage } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

export default function LisibleClubDashboard({ author }) {
  const [type, setType] = useState("text");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePost = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let mediaUrl = "";

      // 🔹 Si c'est un média, upload sur Firebase Storage
      if (file && type !== "text") {
        const storageRef = ref(storage, `clubPosts/${author.id}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        mediaUrl = await new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            null,
            reject,
            async () => resolve(await getDownloadURL(uploadTask.snapshot.ref))
          );
        });
      }

      // 🔹 Préparer le post
      const newPost = {
        authorId: author.id,
        authorName: author.name,
        type,
        content: type === "text" ? content.trim() : mediaUrl,
        description: description.trim(),
        createdAt: serverTimestamp(),
        likes: 0,
      };

      // 🔹 Enregistrer dans Firestore
      await addDoc(collection(db, "clubPosts"), newPost);

      // 🔹 Notification automatique
      await fetch("/api/sendNotification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${author.name} a publié sur Lisible Club`,
          body: description || "Découvrez ce nouveau contenu !",
          type,
        }),
      });

      // Reset
      setContent("");
      setFile(null);
      setDescription("");
      setType("text");

      alert("Publication réussie !");
    } catch (err) {
      console.error("Erreur lors de la publication :", err);
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
        <option value="live_video">Direct Vidéo</option>
        <option value="live_audio">Direct Audio</option>
      </select>

      {type === "text" ? (
        <textarea
          placeholder="Écrivez votre texte ici..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-2 border rounded-md h-32"
        />
      ) : (
        <input
          type="file"
          accept={
            type === "image"
              ? "image/*"
              : type === "video" || type === "live_video"
              ? "video/*"
              : "audio/*"
          }
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full p-2 border rounded-md"
        />
      )}

      <input
        type="text"
        placeholder="Légende ou description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full p-2 border rounded-md"
      />

      <button
        type="submit"
        disabled={loading}
        className={`w-full p-2 rounded-lg text-white ${
          loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {loading ? "Publication..." : "Publier"}
      </button>
    </form>
  );
}