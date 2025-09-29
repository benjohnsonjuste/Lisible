import Link from "next/link";

export default function EventClosed() {
  const events = [
    { id: 1, name: "Battle Poétique International" },
    { id: 2, name: "Foire Virtuelle Cheikh Anta Diop" },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-gray-50 rounded-lg shadow-md max-w-2xl mx-auto mt-10">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">
        Événements actuellement fermés
      </h2>

      <p className="text-gray-600 mb-6">
        Voici la liste des événements qui sont actuellement clôturés.  
        Nous vous donnons rendez-vous pour leur prochaine édition !
      </p>

      {/* Liste des événements */}
      <ul className="mb-8 space-y-3">
        {events.map((event) => (
          <li
            key={event.id}
            className="text-lg font-medium text-gray-800 bg-gray-100 px-4 py-2 rounded-lg"
          >
            {event.name}
          </li>
        ))}
      </ul>

      <p className="text-gray-600 mb-6">
        En attendant, découvrez de magnifiques textes dans notre{" "}
        <strong>Bibliothèque</strong>.
      </p>

      <Link
        href="/bibliotheque"
        className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition"
      >
        Aller à la Bibliothèque
      </Link>
    </div>
  );
}