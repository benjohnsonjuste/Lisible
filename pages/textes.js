import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../lib/firebase";
import Post from "../components/Post";

export default function Home() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchPosts();
  }, []);

  return (
    <div className="container">
      {posts.map(post => (
        <Post key={post.id} post={post} />
      ))}
    </div>
  );
}