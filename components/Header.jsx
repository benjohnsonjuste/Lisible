"use client";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 w-full h-20 bg-white border-b border-gray-200 shadow z-50 flex items-center justify-between px-6">
      {/* Logo / Titre */}
      <h1 className="text-2xl font-bold text-gray-900">Lisible</h1>

      {/* Navigation */}
      <nav className="flex space-x-6">
        <a href="/" className="text-gray-700 hover:text-accent font-medium">
          Accueil
        </a>
        <a href="/texts" className="text-gray-700 hover:text-accent font-medium">
          Bibliothèque
        </a>
        <a href="/publish" className="text-gray-700 hover:text-accent font-medium">
          Publier
        </a>
      </nav>
    </header>
  );
}