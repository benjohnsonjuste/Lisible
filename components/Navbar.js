import Link from "next/link";

export default function Navbar() {
  return (
    <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#1976d2", color: "#fff", width: "100%" }}>
      <div>
        <Link href="/">Lisible</Link>
      </div>

      <div style={{ display: "flex", gap: 16 }}>
        <Link href="/bibliotheque">Bibliothèque</Link>
        <Link href="/login">Connexion</Link>
      </div>
    </nav>
  );
}