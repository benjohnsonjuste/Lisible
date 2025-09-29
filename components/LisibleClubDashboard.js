import { useState } from "react";
import { db, storage } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

export default function LisibleClubDashboard({ author, onNewPost }) {
  const [type, setType] = useState("text");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileKey, setFileKey] = useState(Date.now());

  const handlePost = async (e) => {
    e.preventDefault();
    if (!author || !author.id) {
      alert("Vous devez être connecté pour publier !");
      return;
    }

    setLoading(true);

    try {
      let mediaUrl = "";

      if (file && type !== "text") {
        const folder = type.includes("live") ? "live" : "media";
        const storageRef = ref(
          storage,
          `clubPosts/${folder}/${author.id}/${Date.now()}_${file.name}`
        );

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

      const newPost = {
        authorId: author.id,
        authorName: author.name || "",
        type,
        content: type === "text" ? content.trim() : mediaUrl,
        description: description.trim() || "",
        createdAt: serverTimestamp(),
        likes: 0,
        views: 0,
        isLive: type === "live_video" || type === "live_audio",
      };

      await addDoc(collection(db, "clubPosts"), newPost);

      // Notification via API
      await fetch("/api/sendNotification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${author.name || "Un auteur"} a publié sur Lisible Club`,
          body: description || "Découvrez ce nouveau contenu !",
          type,
        }),
      });

      // Appel de la fonction de notification visuelle
      if (onNewPost) onNewPost();

      // Réinitialisation du formulaire
      setContent("");
      setFile(null);
      setFileKey(Date.now());
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
    <form
      onSubmit={handlePost}
      className="bg-white p-6 rounded-2xl shadow-lg space-y-4"
    >
      <h2 className="text-xl font-bold">Publier sur Lisible Club</h2>

      {/* Sélection du type de publication */}
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

      {/* Zone de texte ou input file */}
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
          accept={
            type === "image"
              ? "image/*"
              : type === "video" || type === "live_video"
              ? "video/*"
              : "audio/*"
          }
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full p-2 border rounded-md"
          required
        />
      )}

      {/* Description */}
      <input
        type="text"
        placeholder="Légende ou description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full p-2 border rounded-md"
      />

      {/* Bouton publier */}
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