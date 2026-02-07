"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 w-full h-20 bg-white border-b border-gray-200 shadow z-50 flex items-center justify-between px-6">
      {/* Logo / Titre */}
      <Link href="/" className="text-2xl font-bold text-gray-900">
        Lisible
      </Link>

      {/* Navigation */}
      <nav className="flex space-x-6">
        <Link href="/" className="text-gray-700 hover:text-accent font-medium">
          Accueil
        </Link>
        <Link href="/texts" className="text-gray-700 hover:text-accent font-medium">
          Bibliothèque
        </Link>
        <Link href="/publish" className="text-gray-700 hover:text-accent font-medium">
          Publier
        </Link>
      </nav>
    </header>
  );
}
