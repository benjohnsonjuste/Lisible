import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { useRouter } from "next/router";

export default function PostPage() {
  const router = useRouter();
  const { id } = router.query;
  const [post, setPost] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      const postRef = doc(db, "posts", id);
      const snap = await getDoc(postRef);
      if (snap.exists()) {
        setPost(snap.data());
        // Incrémenter le compteur de vues
        await updateDoc(postRef, { views: increment(1) });
      }
    };
    fetchPost();
  }, [id]);

  if (!post) return <p>Chargement...</p>;

  return (
    <div style={{ maxWidth: "700px", margin: "auto", padding: "20px" }}>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
      <p style={{ color: "gray" }}>{post.views + 1} vues</p>
    </div>
  );
}