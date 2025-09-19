import Link from "next/link";

export default function Navbar() {
  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "15px 30px",
        background: "#f5f5f5",
        borderBottom: "1px solid #ddd",
      }}
    >
      <div>
        <Link href="/" style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
          Lisible
        </Link>
      </div>
      <div style={{ display: "flex", gap: "20px" }}>
        <Link href="/">Accueil</Link>
        <Link href="/bibliotheque">Bibliothèque</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/login">Connexion</Link>
      </div>
    </nav>
  );
}