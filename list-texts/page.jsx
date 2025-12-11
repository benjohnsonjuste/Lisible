import { useEffect, useState } from "react";
import { toast } from "sonner";

const GITHUB_OWNER = process.env.NEXT_PUBLIC_GITHUB_OWNER;
const GITHUB_REPO = process.env.NEXT_PUBLIC_GITHUB_REPO;
const GITHUB_BRANCH = process.env.NEXT_PUBLIC_GITHUB_BRANCH || "main";

export default function ListTextsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(
          `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/posts?ref=${GITHUB_BRANCH}`
        );
        if (!res.ok) throw new Error("Impossible de récupérer les posts");

        const files = await res.json();
        // récupérer le contenu Markdown de chaque fichier
        const postsData = await Promise.all(
          files.map(async (file) => {
            const rawRes = await fetch(file.download_url);
            const md = await rawRes.text();

            // parser frontmatter simple
            const frontmatterMatch = md.match(/---([\s\S]*?)---/);
            let meta = {};
            if (frontmatterMatch) {
              frontmatterMatch[1].split("\n").forEach((line) => {
                const [key, ...rest] = line.split(":");
                if (key && rest) {
                  meta[key.trim()] = rest.join(":").trim().replace(/^"|"$/g, "");
                }
              });
            }

            return {
              id: file.name,
              url: file.html_url,
              title: meta.title || "Sans titre",
              date: meta.date || "",
              author: meta.author || "",
              image: meta.image || null,
              content: md.replace(/---[\s\S]*?---/, "").trim(),
            };
          })
        );

        // trier par date décroissante
        postsData.sort((a, b) => new Date(b.date) - new Date(a.date));
        setPosts(postsData);
      } catch (err) {
        console.error(err);
        toast.error(err.message || "Erreur lors du chargement des textes");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) return <p className="p-6">Chargement...</p>;
  if (!posts.length) return <p className="p-6">Aucun texte publié pour le moment.</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-4">Tous les textes publiés</h1>
      {posts.map((post) => (
        <div key={post.id} className="border rounded p-4 shadow">
          {post.image && <img src={post.image} alt={post.title} className="w-full max-h-64 object-cover mb-2 rounded" />}
          <h2 className="text-xl font-semibold">{post.title}</h2>
          <p className="text-sm text-gray-500 mb-2">
            {post.date} • {post.author}
          </p>
          <p className="mb-2">{post.content.slice(0, 200)}...</p>
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Lire sur GitHub
          </a>
        </div>
      ))}
    </div>
  );
}
