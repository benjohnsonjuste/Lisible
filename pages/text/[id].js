import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function TextePage() {
  const router = useRouter();
  const { id } = router.query;
  const [post, setPost] = useState(null);

  useEffect(() => {
    if (!id) return;
    fetch("/api/list")
      .then((res) => res.json())
      .then((data) => {
        const found = data.find((item) => item.id === Number(id));
        setPost(found);
      });
  }, [id]);

  if (!post) return <p className="text-center mt-10">Chargement...</p>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-2">{post.titre}</h1>
      <p className="text-gray-600 text-sm mb-4">par {post.auteur}</p>
      {post.imageURL && (
        <img
          src={post.imageURL}
          alt={post.titre}
          className="w-full rounded mb-4"
        />
      )}
      <p className="whitespace-pre-wrap leading-relaxed text-lg">{post.contenu}</p>
      <p className="text-xs text-gray-500 mt-4">{post.date}</p>
    </div>
  );
}