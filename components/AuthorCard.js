export default function AuthorCard({ author }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, border: "1px solid #ddd", borderRadius: 6, padding: 16, width: "100%", boxSizing: "border-box", marginBottom: 12 }}>
      <img src={author.photoURL || "/images/avatar-default.png"} alt={author.name} style={{ width: 60, height: 60, borderRadius: "50%" }} />
      <div>
        <h4>{author.name}</h4>
        <p>{author.subscribers} abonnés</p>
      </div>
    </div>
  );
}