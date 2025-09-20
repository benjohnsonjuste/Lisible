import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 w-full bg-white shadow-md z-50">
      <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <img
            src="https://drive.google.com/uc?export=view&id=1sSJaU4xYfhQ1NSfg-dhJ3YmQ2fDTrIXL"
            alt="Lisible"
            className="h-10 w-auto"
          />
          <span className="text-xl font-bold text-gray-900">Lisible</span>
        </Link>

        {/* Menu Desktop */}
        <div className="hidden md:flex gap-8 text-lg">
          <Link href="/bibliotheque" className="hover:text-blue-600 transition">
            Bibliothèque
          </Link>
          <Link href="/login" className="hover:text-blue-600 transition">
            Connexion
          </Link>
        </div>

        {/* Menu Mobile */}
        <button
          className="md:hidden text-2xl"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>
      </div>

      {/* Dropdown mobile */}
      {menuOpen && (
        <div className="md:hidden bg-white shadow-lg flex flex-col px-6 py-4 gap-3">
          <Link href="/bibliotheque" onClick={() => setMenuOpen(false)}>
            Bibliothèque
          </Link>
          <Link href="/login" onClick={() => setMenuOpen(false)}>
            Connexion
          </Link>
          <Link href="/contact" onClick={() => setMenuOpen(false)}>
            Contact
          </Link>
          <Link href="/terms" onClick={() => setMenuOpen(false)}>
            Termes et Conditions
          </Link>
        </div>
      )}
    </nav>
  );
}