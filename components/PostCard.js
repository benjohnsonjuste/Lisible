export default function PostCard({ post }) {
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 6, padding: 16, marginBottom: 16, width: "100%", boxSizing: "border-box" }}>
      <h3>{post.title}</h3>
      {post.imageURL && <img src={post.imageURL} alt={post.title} style={{ width: "100%", borderRadius: 6, marginBottom: 8 }} />}
      <p>{post.content}</p>
      <small>{post.views} vues • {post.likes} likes</small>
    </div>
  );
}