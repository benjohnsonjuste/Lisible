import { useState } from "react";
import { db, auth } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/router";

export default function Publish() {
  const [user] = useAuthState(auth);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!user) {
    return <p>Connectez-vous pour publier un texte.</p>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return alert("Veuillez remplir tous les champs.");

    setLoading(true);

    try {
      await addDoc(collection(db, "posts"), {
        title,
        content,
        authorName: user.displayName || "Utilisateur",
        uid: user.uid,
        createdAt: serverTimestamp(),
        likeCount: 0,
        likedBy: []
      });

      setTitle("");
      setContent("");
      router.push("/"); // Redirige vers l'accueil
    } catch (error) {
      console.error("Erreur lors de la publication :", error);
      alert("Impossible de publier le texte, réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="publish-container" style={{ maxWidth: "600px", margin: "auto", padding: "2rem" }}>
      <h2>Publier un texte</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <input
          type="text"
          placeholder="Titre du texte"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ padding: "0.5rem", fontSize: "1rem" }}
        />
        <textarea
          placeholder="Écrivez votre texte ici..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={10}
          style={{ padding: "0.5rem", fontSize: "1rem" }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ padding: "0.7rem", fontSize: "1rem", backgroundColor: "#0070f3", color: "#fff", border: "none", cursor: "pointer" }}
        >
          {loading ? "Publication..." : "Publier"}
        </button>
      </form>
    </div>
  );
}