import Layout from "../components/Layout";
import Banner from "../components/Banner";
import ServiceCard from "../components/ServiceCard";

export default function Home() {
  return (
    <Layout>
      <Banner
        title="Bienvenue sur Lisible"
        subtitle="Publiez, lisez et partagez vos écrits en toute simplicité"
        imageUrl="/couverture.jpg"
      />

      <section className="max-w-6xl mx-auto p-6 mt-12 grid md:grid-cols-3 gap-8">
        <ServiceCard
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2" />
            </svg>
          }
          title="Publier facilement"
          description="Publiez vos textes gratuitement en quelques clics."
        />
        <ServiceCard
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.1 0-2 .9-2 2v4h4v-4c0-1.1-.9-2-2-2z" />
            </svg>
          }
          title="Monétisation"
          description="Gagnez de l’argent dès 250 abonnés."
        />
        <ServiceCard
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          }
          title="Statistiques"
          description="Suivez vos lecteurs et votre audience en temps réel."
        />
      </section>

      <div className="text-center mt-12">
        <p className="text-lg font-medium mb-4">Chers auteurs, lancez-vous !</p>
        <a
          href="/login"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full shadow-md transition"
        >
          S'inscrire
        </a>
      </div>
    </Layout>
  );
            }
