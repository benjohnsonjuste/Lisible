import { useState, useEffect } from "react";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import CommentSection from "./CommentSection";

export default function Post({ post }) {
  const [user] = useAuthState(auth);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);

  const handleLike = async () => {
    const postRef = doc(db, "posts", post.id);
    const deviceId = localStorage.getItem("deviceId") || crypto.randomUUID();
    localStorage.setItem("deviceId", deviceId);

    const id = user?.uid || deviceId;
    const likedBefore = post.likedBy?.includes(id);

    if (likedBefore) {
      await updateDoc(postRef, { likedBy: arrayRemove(id), likeCount: likeCount - 1 });
      setLikeCount(likeCount - 1);
      setLiked(false);
    } else {
      await updateDoc(postRef, { likedBy: arrayUnion(id), likeCount: likeCount + 1 });
      setLikeCount(likeCount + 1);
      setLiked(true);
    }
  };

  useEffect(() => {
    const deviceId = localStorage.getItem("deviceId");
    const id = user?.uid || deviceId;
    setLiked(post.likedBy?.includes(id) || false);
  }, [user, post.likedBy]);

  return (
    <div className="post">
      <h2>{post.title}</h2>
      <p>{post.content}</p>
      <p>Par: {post.authorName}</p>
      <button
        onClick={handleLike}
        style={{ color: liked ? "red" : "black" }}
      >
        ❤️ {likeCount}
      </button>
      <CommentSection postId={post.id} />
      <button
        onClick={() => navigator.share ? navigator.share({ title: post.title, text: post.content, url: window.location.href }) : alert("Partager non supporté")}
      >
        🔗 Partager
      </button>
    </div>
  );
}