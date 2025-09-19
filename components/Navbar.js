import Link from "next/link";

export default function Navbar() {
  return (
    <nav style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px 20px",
      background: "#f8f8f8",
      borderBottom: "1px solid #ddd"
    }}>
      <Link href="/">Lisible</Link>
      <div style={{ display: "flex", gap: "15px" }}>
        <Link href="/bibliotheque">Bibliothèque</Link>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/login">Connexion</Link>
      </div>
    </nav>
  );
