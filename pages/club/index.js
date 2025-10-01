"use client";

import { useEffect, useState } from "react";

export default function ClubPage() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    async function fetchPosts() {
      const res = await fetch("/api/drive/list"); // ou Firestore
      const data = await res.json();
      setPosts(data);
    }
    fetchPosts();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Lisible Club</h1>
      {posts.map((post) => (
        <div key={post.id} className="p-4 border rounded-lg shadow">
          <p className="text-gray-500">
            Posté le {new Date(post.createdTime).toLocaleString()}
          </p>

          {post.mimeType.startsWith("text/") && (
            <a
              href={post.webViewLink}
              target="_blank"
              className="text-blue-600 underline"
            >
              Lire le texte : {post.name}
            </a>
          )}

          {post.mimeType.startsWith("image/") && (
            <img
              src={`https://drive.google.com/uc?id=${post.id}`}
              alt={post.name}
              className="rounded-lg mt-2"
            />
          )}

          {post.mimeType.startsWith("video/") && (
            <video controls className="rounded-lg mt-2">
              <source src={`https://drive.google.com/uc?id=${post.id}`} />
            </video>
          )}

          {post.mimeType.startsWith("audio/") && (
            <audio controls className="mt-2">
              <source src={`https://drive.google.com/uc?id=${post.id}`} />
            </audio>
          )}
        </div>
      ))}

      {posts.length === 0 && (
        <p className="text-center text-gray-500">Aucun post pour le moment.</p>
      )}
    </div>
  );
}
