// components/Navbar.js
import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);

  const menuItems = [
    { name: "Accueil", href: "/" },
    { name: "À propos", href: "/qui-sommes-nous" },
    { name: "S'inscrire", href: "/register" },
    { name: "Services", href: "/services" },
    { name: "Contact", href: "/contact" },
    { name: "Termes et conditions", href: "/terms" },
  ];

  return (
    <>
      {/* Barre principale */}
      <nav className="navbar-mobile">
        <div className="navbar-actions-left">
          <button className="navbar-btn" onClick={toggleMenu}>☰</button>
          <Link href="/bibliotheque" className="navbar-btn">
            Bibliothèque
          </Link>
          <Link href="/login" className="navbar-btn">
            Connexion
          </Link>
        </div>
      </nav>

      {/* Fond sombre */}
      <div
        className={`menu-backdrop ${menuOpen ? "open" : ""}`}
        onClick={toggleMenu}
      />

      {/* Menu latéral */}
      <div className={`menu-panel ${menuOpen ? "open" : ""}`}>
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="menu-link"
            onClick={() => setMenuOpen(false)}
          >
            {item.name}
          </Link>
        ))}
      </div>
    </>
  );
}