"use client";
import { useEffect, useState } from "react";

export default function LibraryPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch("https://gsx2json.com/api?id=1XhozRiz4wXLlPUDQ44aGE5Nt4ITD5jNCs63uPhVHB0w");
        const json = await res.json();
        const rows = json.rows || [];

        const formatted = rows
          .filter((row) => row.titre && row.contenu)
          .map((row, index) => ({
            id: index,
            auteur: row.auteur || "Anonyme",
            titre: row.titre,
            contenu: row.contenu,
            image_url: row.image_url || null,
            date: row.date || row.timestamp || "Date inconnue",
          }));

        setPosts(formatted);
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
              <p className="text-xs text-gray-500 mt-2">{post.date}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}