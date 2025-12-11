import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

const GITHUB_OWNER = process.env.NEXT_PUBLIC_GITHUB_OWNER;
const GITHUB_REPO = process.env.NEXT_PUBLIC_GITHUB_REPO;
const GITHUB_BRANCH = process.env.NEXT_PUBLIC_GITHUB_BRANCH || "main";

export default function TextPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const filePath = `posts/${slug}`;
        const res = await fetch(
          `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`
        );
        if (!res.ok) throw new Error("Texte non trouvé sur GitHub");

        const data = await res.json();
        const md = atob(data.content.replace(/\n/g, ""));

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

        setPost({
          title: meta.title || "Sans titre",
          date: meta.date || "",
          author: meta.author || "",
          image: meta.image || null,
          content: md.replace(/---[\s\S]*?---/, "").trim(),
        });
      } catch (err) {
        console.error(err);
        toast.error(err.message || "Erreur chargement du texte");
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchPost();
  }, [slug]);

  if (loading) return <p className="p-6">Chargement...</p>;
  if (!post) return <p className="p-6">Texte introuvable.</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">{post.title}</h1>
      <p className="text-sm text-gray-500">
        {post.date} • {post.author}
      </p>
      {post.image && (
        <img src={post.image} alt={post.title} className="w-full max-h-96 object-cover rounded" />
      )}
      <div className="prose max-w-full" dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, "<br/>") }} />
    </div>
  );
}
