import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import CommentForm from "./CommentForm";

export default function CommentSection({ postId }) {
  const [comments, setComments] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "posts", postId, "comments"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [postId]);

  return (
    <div>
      <h4>Commentaires</h4>
      {comments.map(c => (
        <p key={c.id}><b>{c.authorName}:</b> {c.content}</p>
      ))}
      <CommentForm postId={postId} />
    </div>
  );
}