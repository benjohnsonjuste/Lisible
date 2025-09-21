// components/Navbar.js
import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const menuItems = [
    { name: "Accueil", href: "/" },
    { name: "À propos", href: "/qui-sommes-nous" },
    { name: "S'inscrire", href: "/register" },
    { name: "Services", href: "/services" },
    { name: "Contact", href: "/contact" },
    { name: "Termes et conditions", href: "/terms" },
  ];

  return (
    <nav className="fixed w-full bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        {/* Menu principal */}
        <div className="flex items-center space-x-6">
          <Link href="/bibliotheque">
            <a className="text-lg font-semibold hover:text-blue-600 transition">Bibliothèque</a>
          </Link>
          <Link href="/login">
            <a className="text-lg font-semibold hover:text-blue-600 transition">Connexion</a>
          </Link>
        </div>

        {/* Menu déroulant */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-lg font-semibold hover:text-blue-600 transition md:hidden"
          >
            ☰
          </button>

          <div className={`absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg overflow-hidden transition-all ${menuOpen ? "block" : "hidden"} md:block`}>
            {menuItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <a className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition">
                  {item.name}
                </a>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}