import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto text-center px-4 py-8 space-y-8">
      {/* Image de couverture */}
      <img
        src="/poster_2025-09-28-031039.png"
        alt="Couverture Lisible"
        className="w-full max-h-40 object-cover rounded-lg mb-8"
      />
      <h1 className="text-3xl font-bold mb-4">Bienvenue sur Lisible</h1>
      <p className="text-lg text-gray-700 mb-8">
        Plateforme de lecture en streaming produite par le label littéraire <strong>La Belle Littéraire</strong>.
      </p>

      {/* Présentation détaillée */}
      <div className="text-left space-y-4">
        <p>
          <strong>Pour les lecteurs :</strong> Accédez sans frais à un catalogue varié et soutenez la littérature de demain. La lecture stimule l’imaginaire, enrichit le vocabulaire et favorise la compréhension du monde.
        </p>
        <p>
          <strong>Pour les auteurs :</strong> Partagez vos textes, agrandissez votre fanbase, recevez des retours de vos lecteurs et gagnez en visibilité. Dès 250 abonnés, vous pouvez commencer à monétiser vos écrits.
        </p>
        <p>
          La plateforme met en avant l’importance de l’écriture et encourage la créativité littéraire, tout en créant un lien direct entre auteurs et lecteurs.
        </p>
        <p>
          <strong>À propos de La Belle Littéraire :</strong> Fondé par Ben Johnson Juste, ce label accompagne et valorise les jeunes plumes à travers des publications et événements culturels notamment des concours, concerts et foires littéraires pour promouvoir la littérature.
        </p>
       
      </div>

      {/* Bouton S'inscrire pour auteurs */}
       <p>
         Commencez à publier sur Lisible dès maintenant.
       </p>
      <div className="text-center mt-8">
        <Link href="/register">
          <a className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition">
            S'inscrire
          </a>
        </Link>
      </div>
    </div>
  );
}