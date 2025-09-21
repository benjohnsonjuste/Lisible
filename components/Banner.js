import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed w-full bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          {/* ✅ Image optimisée avec next/image */}
          <Image
            src="/logo.png" // placé dans /public
            alt="Lisible"
            width={40} // largeur en pixels
            height={40} // hauteur en pixels
            className="rounded-md"
            priority // charge rapidement (utile pour le logo)
          />
          <span className="text-xl font-bold">Lisible</span>
        </Link>

        {/* Menu principal */}
        <div className="hidden md:flex space-x-6">
          <Link href="/bibliotheque" className="hover:text-blue-600">
            Bibliothèque
          </Link>
          <Link href="/login" className="hover:text-blue-600">
            Connexion
          </Link>
          <Link href="/services" className="hover:text-blue-600">
            Services
          </Link>
          <Link href="/contact" className="hover:text-blue-600">
            Contact
          </Link>
        </div>

        {/* Bouton mobile */}
        <button
          className="md:hidden text-2xl"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>
      </div>

      {/* Menu mobile */}
      {menuOpen && (
        <div className="md:hidden bg-white shadow-md px-6 py-4 flex flex-col space-y-3">
          <Link href="/bibliotheque">Bibliothèque</Link>
          <Link href="/login">Connexion</Link>
          <Link href="/services">Services</Link>
          <Link href="/contact">Contact</Link>
        </div>
      )}
    </nav>
  );
          }
