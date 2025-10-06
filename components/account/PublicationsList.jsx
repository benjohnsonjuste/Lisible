import React, { useEffect, useState } from "react";

export default function PublicationsList({ userId }) {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch(`/api/publications?authorId=${userId}`)
      .then((r) => r.json())
      .then(setPosts);
  }, [userId]);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Vos publications</h2>
      <ul className="space-y-2">
        {posts.map((post) => (
          <li key={post.id} className="border p-3 rounded">
            <div className="font-bold">{post.title}</div>
            <div className="text-sm text-gray-500">{post.status}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
