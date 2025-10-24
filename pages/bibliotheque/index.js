// pages/bibliotheque/index.jsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import LikeButton from "@/components/LikeButton";
import Image from "next/image";

export default function BibliothequePage() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchTexts = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/github-texts");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Erreur récupération");
        setTexts(json.data || []);
      } catch (err) {
        console.error("fetch texts error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTexts();
  }, []);

  if (loading) return <p className="text-center py-10">Chargement...</p>;

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Bibliothèque</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {texts.map((t) => (
          <article key={t.id} className="bg-white rounded shadow p-4 cursor-pointer hover:shadow-md">
            {t.image ? (
              // image may be a path inside repo; raw GitHub url must be used if you want direct access.
              <img src={convertToRawUrl(t.image)} alt={t.title} className="w-full h-44 object-cover rounded" />
            ) : (
              <div className="w-full h-44 bg-gray-100 flex items-center justify-center text-gray-400">Pas d'image</div>
            )}

            <h2 className="mt-3 font-semibold">{t.title}</h2>
            <p className="text-sm text-gray-600">{t.author}</p>
            <p className="mt-2 text-sm line-clamp-3">{t.excerpt}</p>

            <div className="flex items-center justify-between mt-3">
              <button onClick={() => router.push(`/text/${t.id}`)} className="text-sm text-blue-600">Lire →</button>
              <LikeButton textId={t.id} />
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

function convertToRawUrl(path) {
  // if path begins with /public/uploads/..., transform to raw GitHub content URL
  // e.g. https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path-without-leading-slash}
  if (!path) return "";
  const owner = process.env.NEXT_PUBLIC_GITHUB_OWNER;
  const repo = process.env.NEXT_PUBLIC_GITHUB_REPO;
  const branch = process.env.NEXT_PUBLIC_GITHUB_BRANCH || "main";
  const clean = path.replace(/^\//, "");
  if (!owner || !repo) return path; // fallback
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${clean}`;
}