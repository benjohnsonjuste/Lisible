export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-10">
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
        {/* Section 1 */}
        <div>
          <h3 className="font-semibold text-lg mb-2">Lisible</h3>
          <p className="text-gray-400 text-sm">
            Plateforme pour lire, publier et partager vos écrits. 
            Propulsée par <strong>La Belle Littéraire</strong>.
          </p>
        </div>

        {/* Section 2 */}
        <div>
          <h3 className="font-semibold text-lg mb-2">Navigation</h3>
          <ul className="space-y-1 text-gray-400 text-sm">
            <li><a href="/bibliotheque" className="hover:underline">Bibliothèque</a></li>
            <li><a href="/services" className="hover:underline">Services</a></li>
            <li><a href="/contact" className="hover:underline">Contact</a></li>
            <li><a href="/terms" className="hover:underline">Politique de confidentialité</a></li>
          </ul>
        </div>

        {/* Section 3 */}
        <div>
          <h3 className="font-semibold text-lg mb-2">Réseaux sociaux</h3>
          <p className="text-gray-400 text-sm">Suivez-nous sur nos réseaux :</p>
          <div className="flex justify-center md:justify-start gap-4 mt-2">
            <a href="#" className="hover:text-blue-400">Facebook</a>
            <a href="#" className="hover:text-pink-400">Instagram</a>
            <a href="#" className="hover:text-sky-400">Twitter</a>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="text-center text-gray-500 text-xs border-t border-gray-700 py-4">
        © {new Date().getFullYear()} Lisible – Tous droits réservés.
      </div>
    </footer>
  );
}