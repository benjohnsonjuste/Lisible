import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";

export default function CommentForm({ postId }) {
  const [user] = useAuthState(auth);
  const [comment, setComment] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert("Connectez-vous pour commenter");
    if (!comment.trim()) return;

    const commentRef = collection(db, "posts", postId, "comments");
    await addDoc(commentRef, {
      authorName: user.displayName,
      uid: user.uid,
      content: comment,
      createdAt: serverTimestamp()
    });
    setComment("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Votre commentaire..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <button type="submit">Commenter</button>
    </form>
  );
}