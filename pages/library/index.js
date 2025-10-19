"use client";
import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { app } from "@/firebase"; // ← alias propre

const db = getFirestore(app);

export default function LibraryPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const snapshot = await getDocs(collection(db, "texts"));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPosts(data);
      } catch (err) {
        console.error("Erreur de chargement :", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">📚 Bibliothèque Lisible</h1>

      {loading ? (
        <p>Chargement en cours...</p>
      ) : posts.length === 0 ? (
        <p>Aucun texte publié pour le moment.</p>
      ) : (
        <ul className="space-y-6">
          {posts.map((post) => (
            <li key={post.id} className="border p-4 rounded shadow-sm bg-white">
              <h2 className="text-xl font-semibold">{post.titre}</h2>
              <p className="text-sm text-gray-600 mb-2">par {post.auteur}</p>
              <p className="whitespace-pre-line">{post.contenu}</p>
              {post.image_url && (
                <img
                  src={post.image_url}
                  alt={`Illustration pour ${post.titre}`}
                  className="mt-4 max-h-64 object-cover rounded"
                />
              )}
              <p className="text-xs text-gray-500 mt-2">
                {post.created_at?.toDate?.() ? (
                  post.created_at.toDate().toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                ) : (
                  "Date inconnue"
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}