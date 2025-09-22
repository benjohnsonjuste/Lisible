import Layout from "../components/Layout";

export default function HomePage() {
  return (
    <Layout>
      {/* Section de couverture animée */}
      <section className="header-cover">
        <h1>Lisible</h1>
        <p>Soutenir la littérature de demain</p>
      </section>

      {/* Contenu de présentation */}
      <section className="mt-10 text-center max-w-3xl mx-auto">
        <p className="text-lg text-gray-700">
          Lisible est une initiative de <strong>La Belle Littéraire</strong>, qui vise à soutenir
          les auteurs et offrir aux lecteurs une expérience unique.
        </p>
      </section>
    </Layout>
  );
}