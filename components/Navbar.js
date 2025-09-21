import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <nav className="fixed w-full bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo avec image Google Drive */}
        <Link href="/">
          <a className="flex items-center gap-3">
            <img
              src="https://drive.google.com/uc?export=view&id=1sSJaU4xYfhQ1NSfg-dhJ3YmQ2fDTrIXL"
              alt="Logo Lisible"
              className="h-10 w-auto rounded-md"
            />
            <span className="text-xl font-bold">Lisible</span>
          </a>
        </Link>

        {/* Liens du menu desktop */}
        <div className="hidden md:flex space-x-6">
          <Link href="/bibliotheque"><a className="hover:text-blue-600">Bibliothèque</a></Link>
          <Link href="/login"><a className="hover:text-blue-600">Connexion</a></Link>
          <Link href="/services"><a className="hover:text-blue-600">Services</a></Link>
          <Link href="/contact"><a className="hover:text-blue-600">Contact</a></Link>
        </div>

        {/* Bouton menu mobile */}
        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </button>
      </div>

      {/* Menu mobile */}
      {menuOpen && (
        <div className="md:hidden bg-white shadow-md px-6 py-4 flex flex-col space-y-3">
          <Link href="/bibliotheque"><a>Bibliothèque</a></Link>
          <Link href="/login"><a>Connexion</a></Link>
          <Link href="/services"><a>Services</a></Link>
          <Link href="/contact"><a>Contact</a></Link>
        </div>
      )}
    </nav>
  );
        }
