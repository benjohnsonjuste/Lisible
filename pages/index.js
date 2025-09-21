import Layout from "../components/Layout";
import Banner from "../components/Banner";
import ServiceCard from "../components/ServiceCard";

export default function Home() {
  return (
    <Layout>
      <Banner
        title="Bienvenue sur Lisible"
        subtitle="Un espace pour publier, lire et partager vos écrits"
        imageUrl="https://drive.google.com/uc?export=view&id=1p8jDVQpk9oDnG4WV6cydFEc6GsqKVyP0"
      />

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
          description="Suivez vos lectures, vos abonnés et votre audience."
        />
      </section>

      {/* Autres sections comme dans les exemples précédents */}
    </Layout>
  );
}