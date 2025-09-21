import Layout from "../components/Layout";
import Banner from "../components/Banner";
import ServiceCard from "../components/ServiceCard";

export default function Home() {
  return (
    <Layout>
      {/* Bannière */}
      <Banner
        title="Bienvenue sur Lisible"
        subtitle="Un espace pour publier, lire et partager vos écrits"
        imageUrl="/couverture.jpg" // mettre l'image dans /public
      />

      {/* Services */}
      <section className="max-w-6xl mx-auto p-6 mt-12 grid md:grid-cols-3 gap-8">
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
          description="Suivez vos lectures et votre audience."
        />
      </section>

      {/* Présentation */}
      <section className="max-w-4xl mx-auto p-6 mt-16 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Lire. Écrire. Partager.</h2>
        <p className="text-gray-700 leading-relaxed text-lg mb-4">
          Lisible est une plateforme produite par <strong>La Belle Littéraire</strong>, reconnue pour ses concours et festivals internationaux.
        </p>
        <p className="text-gray-700 leading-relaxed text-lg mb-4">
          Pour les lecteurs : profitez d’une lecture gratuite et suivez vos auteurs préférés.
        </p>
        <p className="text-gray-700 leading-relaxed text-lg mb-4">
          Pour les auteurs : publiez vos œuvres, suivez vos statistiques et monétisez dès 250 abonnés.
        </p>
      </section>

      {/* Appel à l'action */}
      <section className="max-w-4xl mx-auto p-6 mt-12 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Chers auteurs, lancez-vous !</h2>
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