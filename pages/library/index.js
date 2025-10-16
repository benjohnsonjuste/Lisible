import { useEffect, useState } from "react";

export default function Home() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch("/api/list")
      .then((res) => res.json())
      .then((data) => setPosts(data));
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Publications récentes</h1>
      {posts.length === 0 ? (
        <p>Aucun texte pour le moment.</p>
      ) : (
        posts.map((post) => (
          <div key={post.id} className="mb-6 p-4 bg-white rounded shadow">
            <h2 className="text-xl font-semibold">{post.titre}</h2>
            <p className="text-gray-600 text-sm mb-2">par {post.auteur}</p>
            {post.imageURL && (
              <img
                src={post.imageURL}
                alt={post.titre}
                className="w-full h-auto rounded mb-2"
              />
            )}
            <p>{post.contenu}</p>
            <p className="text-xs text-gray-500 mt-2">{post.date}</p>
          </div>
        ))
      )}
    </div>
  );
}