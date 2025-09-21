// components/Navbar.js
import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { name: 'Accueil', href: '/' },
    { name: 'À propos', href: '/qui-sommes-nous' },
    { name: 'S\'inscrire', href: '/register' },
    { name: 'Services', href: '/services' },
    { name: 'Contact', href: '/contact' },
    { name: 'Termes et conditions', href: '/terms' },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        {/* Barre d'outils horizontale */}
        <div className="flex items-center space-x-6">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-xl font-semibold text-gray-700 md:hidden"
          >
            ☰
          </button>

          <Link href="/bibliotheque">
            <a className="text-lg font-semibold text-gray-700 hover:text-blue-600 transition">Bibliothèque</a>
          </Link>

          <Link href="/login">
            <a className="text-lg font-semibold text-gray-700 hover:text-blue-600 transition">Connexion</a>
          </Link>
        </div>

        {/* Menu déroulant */}
        <div
          className={`absolute top-16 left-0 w-full bg-white shadow-md md:relative md:top-0 md:flex md:items-center md:space-x-6 md:bg-transparent md:shadow-none ${
            isMenuOpen ? 'block' : 'hidden'
          }`}
        >
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-2 text-lg font-semibold text-gray-700 hover:text-blue-600 transition md:inline-block md:px-0 md:py-0"
              >
                {item.name}
              </a>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}