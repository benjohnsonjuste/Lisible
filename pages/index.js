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
        imageUrl="/couverture.jpg"
      />

      {/* Section services */}
      <section className="max-w-6xl mx-auto p-6 mt-12 grid md:grid-cols-3 gap-8">
        <ServiceCard
          title="Publier facilement"
          description="Publiez vos textes simplement et gratuitement."
        />
        <ServiceCard
          title="Monétisation à partir de 250 abonnés"
          description="Gagnez de l’argent avec vos œuvres et suivez vos gains."
        />
        <ServiceCard
          title="Statistiques & Abonnés"
          description="Suivez vos lectures, vos abonnés et votre audience en temps réel."
        />
      </section>

      {/* Présentation détaillée */}
      <section className="max-w-4xl mx-auto p-6 mt-16 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Lire. Écrire. Partager.
        </h2>
        <p className="text-gray-700 leading-relaxed text-lg mb-6">
          Lisible est une plateforme innovante produite par le label littéraire{" "}
          <strong>La Belle Littéraire</strong>, connue pour ses concours et festivals littéraires à l’échelle internationale.
          Nous connectons lecteurs et auteurs dans un espace moderne, interactif et rémunérateur.
        </p>

        <p className="text-gray-700 leading-relaxed text-lg mb-4">
          <strong>Pour les lecteurs :</strong> profitez d’une lecture 100 % gratuite, suivez vos auteurs préférés
          et découvrez des œuvres uniques chaque jour.
        </p>

        <p className="text-gray-700 leading-relaxed text-lg mb-4">
          <strong>Pour les auteurs :</strong> publiez vos œuvres librement, suivez vos statistiques et
          commencez à monétiser vos écrits à partir de <strong>250 abonnés</strong>.
          Ni Lisible ni sa maison-mère, La Belle Littéraire, ne gardent de droits sur vos créations.
        </p>

        <p className="text-gray-700 leading-relaxed text-lg">
          Les statistiques et abonnements vous permettent d’optimiser votre visibilité,
          d’améliorer votre contenu et d’augmenter vos revenus. 
        </p>
      </section>

      {/* Appel à l’action */}
      <section className="max-w-4xl mx-auto p-6 mt-12 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Chers auteurs, lancez-vous !
        </h2>
        <p className="text-gray-700 leading-relaxed text-lg mb-8">
          Rejoignez Lisible dès aujourd’hui et commencez à partager vos œuvres avec le monde entier.
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
