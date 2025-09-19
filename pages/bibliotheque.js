import React from "react";
import PostCard from "../components/PostCard";

export default function Bibliotheque() {
  const posts = [
    { id: 1, title: "Premier texte", author: "Jean Dupont" },
    { id: 2, title: "Deuxième texte", author: "Marie Claire" },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <h1>Bibliothèque</h1>
      <div style={{ display: "grid", gap: "10px" }}>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}