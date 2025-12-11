// /app/texts/[...path]/page.jsx
import React from "react";

async function fetchPost(path) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/get-post?path=${encodeURIComponent(path)}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch post");
  return res.json();
}

export default async function Page({ params }) {
  // params.path is array, join to get path
  const path = (params.path || []).join("/");
  if (!path) return <div>Missing path</div>;
  const data = await fetchPost(path);
  if (!data.ok) return <div>Erreur: {data.error}</div>;
  const { frontmatter, content } = data;
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">{frontmatter.title}</h1>
      <p className="text-sm text-gray-600 mb-4">{frontmatter.author} • {frontmatter.date}</p>
      <div className="prose" dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, "<br/>") }} />
      {/* You can add like/comment UI here that calls /api/like and /api/comment */}
    </div>
  );
}