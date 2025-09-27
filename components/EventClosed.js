// components/EventClosed.js
import Link from "next/link";

export default function EventClosed({ eventName }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-gray-50 rounded-lg shadow-md max-w-2xl mx-auto mt-10">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">{eventName}</h2>
      <p className="text-gray-600 mb-4">
        Cet événement est actuellement fermé. Nous vous donnons rendez-vous pour la prochaine édition !
      </p>
      <p className="text-gray-600 mb-6">
        En attendant, profitez-en pour visiter notre <strong>Bibliothèque</strong> et découvrir tous les textes disponibles sur Lisible.
      </p>
      <Link href="/bibliotheque">
        <button className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition">
          Aller à la Bibliothèque
        </button>
      </Link>
    </div>
  );
}