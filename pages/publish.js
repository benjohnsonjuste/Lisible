import { useState } from "react";
import { db, auth } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/router";
import toast, { Toaster } from "react-hot-toast";

export default function Publish() {
  const [user, loadingUser] = useAuthState(auth);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (loadingUser) return <p>Chargement...</p>;
  if (!user) return <p>Connectez-vous pour publier un texte.</p>;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return toast.error("Veuillez remplir tous les champs.");

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

      toast.success("Texte publié avec succès !");
      setTitle("");
      setContent("");
      setTimeout(() => router.push("/"), 1000); // Laisser le toast visible avant redirection
    } catch (error) {
      console.error("Erreur lors de la publication :", error);
      toast.error("Impossible de publier le texte, réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="publish-container" style={{ maxWidth: "600px", margin: "auto", padding: "2rem" }}>
      <Toaster position="top-right" />
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