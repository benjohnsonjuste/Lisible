import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 w-full bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo + nom du site */}
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="Lisible" className="h-10 w-auto" />
          <span className="text-xl font-bold text-gray-800">Lisible</span>
        </Link>

        {/* Liens desktop */}
        <div className="hidden md:flex space-x-8">
          <Link href="/bibliotheque" className="hover:text-blue-600">Bibliothèque</Link>
          <Link href="/login" className="hover:text-blue-600">Connexion</Link>
        </div>

        {/* Bouton menu mobile */}
        <button
          className="md:hidden text-2xl"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>
      </div>

      {/* Menu mobile */}
      {menuOpen && (
        <div className="md:hidden bg-white shadow-md px-6 py-4 flex flex-col space-y-4">
          <Link href="/bibliotheque" onClick={() => setMenuOpen(false)}>Bibliothèque</Link>
          <Link href="/login" onClick={() => setMenuOpen(false)}>Connexion</Link>
          <Link href="/services" onClick={() => setMenuOpen(false)}>Services</Link>
          <Link href="/contact" onClick={() => setMenuOpen(false)}>Contact</Link>
        </div>
      )}
    </nav>
  );
}