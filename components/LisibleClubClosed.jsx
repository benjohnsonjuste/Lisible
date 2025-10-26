import Link from "next/link";

export default function ClubComingSoon() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-gray-50 rounded-lg shadow-md max-w-2xl mx-auto mt-10">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">
        Lisible Club arrive bientôt !
      </h2>

      <p className="text-gray-600 mb-6 leading-relaxed">
        Le <strong>Lisible Club</strong> sera un espace exclusif pour les lecteurs, 
        auteurs et passionnés de littérature du monde entier.  
        Préparez-vous à rejoindre une communauté vivante, avec des discussions, des concours et des lectures en direct.
      </p>

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-8 shadow-sm max-w-md">
        <p className="text-lg font-medium text-gray-700">
          Ouverture prévue prochainement
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Restez à l’écoute pour ne pas manquer l’annonce officielle.
        </p>
      </div>

      <p className="text-gray-600 mb-6">
        En attendant, explorez les œuvres de notre{" "}
        <strong>Bibliothèque Lisible</strong>.
      </p>

      <Link
        href="/library"
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
      >
        Visiter la Bibliothèque
      </Link>
    </div>
  );
}