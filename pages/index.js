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
        <p className="text-gray-700 leading-relaxed text-lg">
          Lisible connecte les lecteurs et les auteurs. Découvrez des textes
          inspirants, suivez vos auteurs préférés et publiez vos propres
          écrits. Notre objectif est de créer un espace littéraire moderne,
          interactif et rémunérateur pour les créateurs.
        </p>
      </section>
    </Layout>
  );
}