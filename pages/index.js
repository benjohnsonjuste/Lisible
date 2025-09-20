import Layout from "../components/Layout";

export default function Home() {
  return (
    <Layout>
      {/* Image de couverture */}
      <div className="relative w-full h-[70vh]">
        <img
          src="https://drive.google.com/uc?export=view&id=1p8jDVQpk9oDnG4WV6cydFEc6GsqKVyP0"
          alt="Couverture"
          className="object-cover w-full h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/80 flex items-center justify-center">
          <h1 className="text-4xl md:text-6xl text-white font-bold text-center">
            Bienvenue sur Lisible
          </h1>
        </div>
      </div>

      {/* Présentation */}
      <section className="max-w-4xl mx-auto p-6 mt-10 text-center">
        <h2 className="text-3xl font-bold mb-6">Lire. Écrire. Partager.</h2>
        <p className="text-gray-700 leading-relaxed text-lg mb-4">
          Lisible connecte les lecteurs et les auteurs. Découvrez des textes
          inspirants, suivez vos auteurs préférés et publiez vos propres écrits.
          Notre objectif est de créer un espace littéraire moderne, interactif
          et rémunérateur pour les créateurs.
        </p>
        <p className="text-gray-700 leading-relaxed text-lg mb-4">
          Pour les lecteurs : profitez de la lecture gratuite, suivez vos auteurs
          préférés et découvrez des œuvres uniques.
        </p>
        <p className="text-gray-700 leading-relaxed text-lg mb-4">
          Pour les auteurs : monétisez vos œuvres à partir de 250 abonnés,
          suivez vos statistiques, vos abonnés et vos lectures. Lisible et sa
          maison mère, La Belle Littéraire, ne gardent aucun droit sur vos
          œuvres.
        </p>
      </section>

      {/* Appel à l'action pour les auteurs */}
      <section className="max-w-4xl mx-auto p-6 mt-10 text-center">
        <h2 className="text-3xl font-bold mb-6">Chers auteurs, lancez-vous !</h2>
        <p className="text-gray-700 leading-relaxed text-lg mb-6">
          Rejoignez Lisible dès aujourd'hui et commencez à partager vos œuvres avec le monde.
        </p>
        <a
          href="/register"
          className="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          S'inscrire
        </a>
      </section>
    </Layout>
  );
}