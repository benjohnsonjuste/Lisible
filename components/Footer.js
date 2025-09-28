// components/Footer.js
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-gray-100 py-6 border-t border-gray-200 mt-10">
      <div className="container mx-auto text-center px-4">
        {/* Texte principal */}
        <p className="text-sm text-gray-700">
          © 2025 - <span className="font-bold">Lisible</span>
        </p>
        <p className="text-sm text-gray-600 mt-1">
          Plateforme de lecture en streaming
        </p>

        <p className="text-sm text-gray-600 mt-1">
          Une production de <span className="font-semibold">La Belle Littéraire</span>
        </p>

        <p className="text-sm text-gray-600 mt-1">
          22 rue A. Lazarre, Delmas, Haïti
        </p>

      </div>
    </footer>
  );
}