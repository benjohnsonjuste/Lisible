import Layout from "../components/Layout";
import Banner from "../components/Banner";
import ServiceCard from "../components/ServiceCard";

export default function Home() {
  return (
    <Layout>
      {/* Bannière de couverture */}
      <Banner
        title="Bienvenue sur Lisible"
        subtitle="Un espace pour publier, lire et partager vos écrits"
        imageUrl="/couverture.jpg" // placer l'image dans /public/couverture.jpg
      />

      {/* Section services */}
      <section className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8 mt-8 md:mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <ServiceCard
          title="Publier facilement"
          description="Publiez vos textes simplement et gratuitement."
        />
        <ServiceCard
          title="Monétisation à partir de 250 abonnés"
          description="Gagnez de l’argent avec vos œuvres."
        />
        <ServiceCard
          title="Statistiques & Abonnés"
          description="Suivez vos lectures, vos abonnés et votre audience."
        />
        <ServiceCard
          title="Communauté active"
          description="Connectez-vous avec des lecteurs passionnés."
        />
      </section>

      {/* Présentation détaillée */}
      <section className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 mt-12 md:mt-16 text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 md:mb-6">
          Lire. Écrire. Partager.
        </h2>
        <p className="text-gray-700 leading-relaxed text-sm sm:text-base md:text-lg mb-4">
          Lisible est une plateforme innovante produite par le label littéraire <strong>La Belle Littéraire</strong>,
          reconnue pour ses concours et festivals internationaux. Nous connectons lecteurs et auteurs dans un espace moderne, interactif et rémunérateur.
        </p>
        <p className="text-gray-700 leading-relaxed text-sm sm:text-base md:text-lg mb-4">
          <strong>Pour les lecteurs :</strong> profitez de la lecture gratuite, suivez vos auteurs préférés et découvrez des œuvres uniques.
        </p>
        <p className="text-gray-700 leading-relaxed text-sm sm:text-base md:text-lg mb-4">
          <strong>Pour les auteurs :</strong> publiez vos œuvres librement, suivez vos statistiques et commencez à monétiser vos créations à partir de <strong>250 abonnés</strong>. Ni Lisible ni La Belle Littéraire ne gardent de droits sur vos textes.
        </p>
      </section>

      {/* Appel à l’action */}
      <section className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 mt-12 text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 md:mb-6">
          Chers auteurs, lancez-vous !
        </h2>
        <p className="text-gray-700 leading-relaxed text-sm sm:text-base md:text-lg mb-6">
          Rejoignez Lisible dès aujourd’hui et commencez à partager vos œuvres avec le monde entier.
        </p>
        <a
          href="/register"
          className="inline-block bg-blue-600 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-md"
        >
          S'inscrire
        </a>
      </section>
    </Layout>
  );
}