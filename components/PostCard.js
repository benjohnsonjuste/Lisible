import { useRouter } from "next/router";

export default function PostCard({ post }) {
  const router = useRouter();

  if (!post) return null;

  return (
    <div
      onClick={() => router.push(`/post/${post.id}`)}
      style={{
        border: "1px solid #ddd",
        borderRadius: "12px",
        padding: "15px",
        margin: "10px 0",
        cursor: "pointer",
        backgroundColor: "#fff",
      }}
    >
      {post.image && (
        <img
          src={post.image}
          alt={post.title}
          style={{
            width: "100%",
            height: "180px",
            objectFit: "cover",
            borderRadius: "8px",
            marginBottom: "10px",
          }}
        />
      )}
      <h3>{post.title}</h3>
      <p>{post.excerpt}</p>
    </div>
  );
}