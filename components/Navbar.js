// components/Navbar.js
import { useState } from "react";
import Link from "next/link";

export default function NavbarMobile() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const menuItems = [
    { name: "Accueil", href: "/index" },
    { name: "À propos", href: "/qui-sommes-nous" },
    { name: "S'inscrire", href: "/register" },
    { name: "Services", href: "/services" },
    { name: "Contact", href: "/contact" },
    { name: "Termes et conditions", href: "/terms" },
  ];

  return (
    <>
      <nav className="navbar-mobile">
        <Link href="/">
          <a className="navbar-logo">Lisible</a>
        </Link>

        <div className="navbar-actions">
          <Link href="/bibliotheque">
            <a className="navbar-btn">Bibliothèque</a>
          </Link>
          <Link href="/login">
            <a className="navbar-btn">Connexion</a>
          </Link>
          <button className="navbar-btn" onClick={toggleMenu}>
            ☰
          </button>
        </div>
      </nav>

      {/* Backdrop */}
      <div
        className={`menu-backdrop ${menuOpen ? "open" : ""}`}
        onClick={toggleMenu}
      />

      {/* Panneau du menu */}
      <div className={`menu-panel ${menuOpen ? "open" : ""}`}>
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <a onClick={toggleMenu}>{item.name}</a>
          </Link>
        ))}
      </div>
    </>
  );
}