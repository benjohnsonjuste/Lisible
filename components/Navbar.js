// components/Navbar.js
import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        {/* Menu principal */}
        <div className="flex items-center gap-6">
          <button
            className="md:hidden px-3 py-2 border rounded text-gray-700 hover:bg-gray-100"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ☰
          </button>
          <Link href="/bibliotheque">
            <a className="text-gray-800 font-semibold hover:text-blue-600">Bibliothèque</a>
          </Link>
          <Link href="/login">
            <a className="text-gray-800 font-semibold hover:text-blue-600">Connexion</a>
          </Link>
        </div>

        {/* Liens secondaires dans le menu burger */}
        {menuOpen && (
          <div className="absolute top-full left-0 w-full bg-white shadow-md md:hidden px-6 py-4 flex flex-col gap-3">
            <Link href="/"><a className="hover:text-blue-600">Accueil</a></Link>
            <Link href="/register"><a className="hover:text-blue-600">S'inscrire</a></Link>
            <Link href="/services"><a className="hover:text-blue-600">Services</a></Link>
            <Link href="/about"><a className="hover:text-blue-600">À propos</a></Link>
            <Link href="/contact"><a className="hover:text-blue-600">Contact</a></Link>
            <Link href="/terms"><a className="hover:text-blue-600">Termes et conditions</a></Link>
          </div>
        )}
      </div>
    </nav>
  );
}