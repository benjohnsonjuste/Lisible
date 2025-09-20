export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="max-w-7xl mx-auto text-center">
        <p>© {new Date().getFullYear()} Lisible — Produit par La Belle Littéraire.</p>
        <p>
          Adresse : 36 rue Des Rosiers, Delmas Ouest, Haïti. | <a href="/terms" className="underline">Termes & Conditions</a> | <a href="/contact" className="underline">Contact</a>
        </p>
      </div>
    </footer>
  );
}