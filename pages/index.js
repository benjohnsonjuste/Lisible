import Layout from "../components/Layout";

export default function Home() {
  return (
    <Layout>
      {/* Image de couverture */}
      <div className="relative w-full h-[70vh]">
        <img
          src="https://drive.google.com/uc?export=view&id=1p8jDVQpk9oDnG4WV6cydFEc6GsqKVyP0"
          alt="Couverture Lisible"
          className="object-cover w-full h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/80 flex items-center justify-center">
          <h1 className="text-4xl md:text-6xl text-white font-bold text-center px-4">
            Bienvenue sur Lisible
          </h1>
        </div>
      </div>

      {/* Présentation globale */}
      <section className="max-w-6xl mx-auto p-6 mt-10 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Lire. Écrire. Partager.</h2>
        <p className="text-gray-700 leading-relaxed text-lg mb-6 px-4 md:px-0">
          Lisible est une plateforme innovante produite par le label littéraire <strong>La Belle Littéraire</strong>, reconnue pour ses concours et festivals à l’échelle internationale. Nous connectons lecteurs et auteurs dans un espace moderne, interactif et rémunérateur.
        </p>

        <div className="grid md:grid-cols-2 gap-12 mt-8 text-left px-4 md:px-0">
          <div className="bg-gray-50 p-6 rounded-xl shadow-md">
            <h3 className="text-2xl font-semibold mb-4">Bienfaits de la lecture</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Stimule l'imagination et la créativité</li>
              <li>Améliore la concentration et la mémoire</li>
              <li>Découverte de nouveaux horizons et cultures</li>
              <li>Renforce la compréhension et l'esprit critique</li>
            </ul>
          </div>

          <div className="bg-gray-50 p-6 rounded-xl shadow-md">
            <h3 className="text-2xl font-semibold mb-4">Bienfaits de l'écriture</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Permet de s'exprimer et de libérer ses idées</li>
              <li>Aide à structurer sa pensée et améliorer son style</li>
              <li>Favorise l'estime de soi et la confiance</li>
              <li>Peut générer des revenus dès 250 abonnés</li>
            </ul>
          </div>
        </div>

        <div className="mt-16 text-left px-4 md:px-0 space-y-6">
          <h3 className="text-2xl font-semibold">Intérêts pour les lecteurs</h3>
          <p className="text-gray-700 leading-relaxed">
            Profitez de la lecture gratuite, suivez vos auteurs préférés, découvrez des œuvres uniques et participez activement à la vie littéraire de la plateforme.
          </p>

          <h3 className="text-2xl font-semibold">Intérêts pour les auteurs</h3>
          <p className="text-gray-700 leading-relaxed">
            Publiez vos textes librement, suivez vos statistiques, vos abonnés et vos lectures. Monétisez vos œuvres à partir de <strong>250 abonnés</strong>. Lisible et La Belle Littéraire ne gardent aucun droit sur vos contenus.
          </p>

          <h3 className="text-2xl font-semibold">Importance des statistiques et abonnements</h3>
          <p className="text-gray-700 leading-relaxed">
            Les statistiques et abonnements permettent aux auteurs de mieux connaître leur audience, d’améliorer leur contenu et d’optimiser la monétisation de leurs œuvres. Plus vos lecteurs interagissent, plus votre visibilité et vos revenus augmentent.
          </p>
        </div>
      </section>

      {/* Appel à l'action pour les auteurs */}
      <section className="max-w-4xl mx-auto p-6 mt-16 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Chers auteurs, lancez-vous !</h2>
        <p className="text-gray-700 leading-relaxed text-lg mb-8 px-4 md:px-0">
          Rejoignez Lisible dès aujourd'hui et commencez à partager vos œuvres avec le monde entier. Publiez vos textes, suivez vos statistiques, gagnez des abonnés et monétisez vos créations.
        </p>
        <a
          href="/register"
          className="inline-block bg-blue-600 text-white font-semibold px-8 py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-md"
        >
          S'inscrire
        </a>
      </section>
    </Layout>
  );
}