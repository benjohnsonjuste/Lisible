import Link from "next/link";

export default function Conditions() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6 text-center">Conditions d’utilisation de Lisible</h1>

      <p className="mb-4">
        Bienvenue sur <strong>Lisible</strong>, plateforme de lecture en streaming produite par le label littéraire <strong>La Belle Littéraire</strong>, structure légale reconnue par l'État haïtien. En utilisant cette plateforme, vous acceptez les présentes Conditions d’utilisation.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">1. Objet de Lisible</h2>
      <p className="mb-4">
        Lisible permet aux lecteurs d’accéder gratuitement à un catalogue d’œuvres littéraires et aux auteurs de publier leurs textes, d’agrandir leur fanbase et de monétiser leurs œuvres à partir de 250 abonnés. Lisible agit uniquement comme un intermédiaire de diffusion et ne revendique aucun droit sur les œuvres publiées.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">2. Données personnelles et confidentialité</h2>
      <p className="mb-2">
        Les données collectées (nom, email, informations de profil, abonnements, historique de lecture) sont utilisées uniquement pour faciliter la navigation et les interactions sur la plateforme.
      </p>
      <p className="mb-2">
        Lisible ne vend ni ne partage vos informations personnelles à des tiers à des fins commerciales. Toutes vos données sont stockées de manière sécurisée.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">3. Nécessité d’être connecté</h2>
      <p className="mb-2">
        Certaines fonctionnalités nécessitent un compte utilisateur :
      </p>
      <ul className="list-disc list-inside mb-4">
        <li>Publier un texte</li>
        <li>S’abonner à un auteur</li>
        <li>Aimer un texte</li>
      </ul>
      <p className="mb-4">La création d’un compte est gratuite et obligatoire pour ces actions.</p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">4. Droits d’auteur et propriété intellectuelle</h2>
      <p className="mb-2">
        Chaque auteur conserve tous les droits sur ses œuvres. Lisible n’a aucun droit de reproduction, modification ou redistribution sans autorisation. Les utilisateurs s’engagent à respecter ces droits.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">5. Utilisation responsable</h2>
      <p className="mb-2">
        Les utilisateurs s’engagent à :
      </p>
      <ul className="list-disc list-inside mb-4">
        <li>Ne pas publier de contenus illégaux ou offensants</li>
        <li>Respecter les autres auteurs et lecteurs</li>
        <li>Ne pas créer de comptes multiples pour fausser abonnements ou likes</li>
      </ul>
      <p className="mb-4">
        Lisible se réserve le droit de supprimer tout compte ou contenu enfreignant ces règles.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">6. Assistance et contact</h2>
      <p className="mb-4">
        En cas de problème technique ou de difficulté avec le service, contactez notre équipe : <a href="mailto:support@labellelitteraire.ht" className="text-blue-600 underline">support@labellelitteraire.ht</a>. Nos opérateurs sont disponibles pour assister tous les utilisateurs.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">7. Responsabilité</h2>
      <p className="mb-4">
        Lisible fournit l’accès aux textes "en l’état". Les auteurs sont responsables de la légalité et de la véracité des contenus. Lisible n’est pas responsable des litiges entre utilisateurs ou d’une mauvaise utilisation des contenus.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">8. Modifications des Conditions</h2>
      <p className="mb-4">
        Lisible peut modifier ces conditions à tout moment. L’utilisation continue de la plateforme vaut acceptation des nouvelles conditions.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">9. Acceptation</h2>
      <p className="mb-4">
        En utilisant Lisible, vous confirmez avoir lu et accepté ces conditions, à respecter les droits d’auteur et à utiliser la plateforme de manière responsable.
      </p>

      {/* Liens supplémentaires */}
      <div className="text-center mt-8 space-y-4">
        <p>
          Suivez-nous sur notre page Facebook :{" "}
          <a href="https://www.facebook.com/labellelitteraire" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
            La Belle Littéraire
          </a>
        </p>
        <Link href="/signup">
          <a className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition">
            S'inscrire pour publier
          </a>
        </Link>
        <Link href="/">
          <a className="inline-block bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-6 py-3 rounded-lg transition">
            Retour à l'accueil
          </a>
        </Link>
      </div>
    </div>
  );
}