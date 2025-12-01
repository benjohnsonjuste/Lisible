import { useState } from "react";
import { db, auth } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/router";

export default function Publish() {
  const [user] = useAuthState(auth);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const router = useRouter();

  if (!user) {
    return <p>Connectez-vous pour publier un texte.</p>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    await addDoc(collection(db, "posts"), {
      title,
      content,
      authorName: user.displayName,
      uid: user.uid,
      createdAt: serverTimestamp(),
      likeCount: 0,
      likedBy: []
    });

    setTitle("");
    setContent("");
    router.push("/"); // Retour à la page d'accueil
  };

  return (
    <div className="publish-container">
      <h2>Publier un texte</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Titre du texte"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Écrivez votre texte ici..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button type="submit">Publier</button>
      </form>
    </div>
  );
}