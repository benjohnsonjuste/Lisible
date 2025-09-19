import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import FollowButton from "../../components/FollowButton";

export default function AuthorPage({ authorId }) {
  const [author, setAuthor] = useState(null);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchAuthor = async () => {
      const ref = doc(db, "users", authorId);
      const snap = await getDoc(ref);
      if (snap.exists()) setAuthor({ id: snap.id, ...snap.data() });
    };
    const fetchPosts = async () => {
      const q = query(collection(db, "posts"), where("authorId", "==", authorId));
      const snap = await getDocs(q);
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };
    fetchAuthor();
    fetchPosts();
  }, [authorId]);

  if (!author) return <p>Chargement...</p>;

  return (
    <div style={{ maxWidth: "900px", margin: "auto", padding: "40px" }}>
      <h1>{author.name}</h1>
      <p>{author.bio}</p>
      <p><b>{author.followers || 0}</b> abonnés</p>
      <FollowButton authorId={author.id} />

      <h2>Ses textes</h2>
      <ul>
        {posts.map((p) => (
          <li key={p.id}>
            <a href={`/post/${p.id}`}>{p.title}</a> ({p.views || 0} vues)
          </li>
        ))}
      </ul>

      {author.monetizationEnabled ? (
        <p style={{ color: "green" }}>💰 Monétisation activée</p>
      ) : (
        <p style={{ color: "gray" }}>Monétisation verrouillée (250 abonnés requis)</p>
      )}
    </div>
  );
}