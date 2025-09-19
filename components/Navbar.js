import Link from "next/link";

export default function Navbar() {
  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "15px",
        backgroundColor: "#eee",
      }}
    >
      <div style={{ display: "flex", gap: "15px" }}>
        <Link href="/bibliotheque">Bibliothèque</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/login">Connexion</Link>
      </div>
    </nav>
  );
}