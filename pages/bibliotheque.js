import PostCard from "@/components/PostCard";

export default function Bibliotheque() {
  const mockPosts = [
    { id: "1", title: "Premier poème", excerpt: "Ceci est un extrait." },
    { id: "2", title: "Deuxième poème", excerpt: "Un autre extrait." }
  ];

  return (
    <div style={{ padding: "20px" }}>
      <h1>Bibliothèque</h1>
      <div style={{ display: "grid", gap: "20px" }}>
        {mockPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
