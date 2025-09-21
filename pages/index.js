import Layout from "../components/Layout";
import Link from "next/link";

export default function HomePage() {
  return (
    <Layout>
      {/* Section de bienvenue */}
      <section className="flex flex-col items-center justify-center text-center p-10 bg-gray-50">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Bienvenue sur <span className="text-blue-600">Lisible</span>
        </h1>
        <p className="text-gray-600 max-w-xl mb-6">
          La plateforme où vous pouvez lire, publier et partager vos textes en toute simplicité.
        </p>
        <div className="flex gap-4">
          <Link href="/bibliotheque" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Découvrir la bibliothèque
          </Link>
          <Link href="/register" className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition">
            Créer un compte
          </Link>
        </div>
      </section>

      {/* Section des fonctionnalités */}
      <section className="grid md:grid-cols-3 gap-8 p-10 max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-semibold mb-2">📚 Bibliothèque</h2>
          <p className="text-gray-600">
            Parcourez des centaines de textes, découvrez de nouveaux auteurs et laissez-vous inspirer.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-semibold mb-2">✍️ Publiez</h2>
          <p className="text-gray-600">
            Créez un compte et publiez vos propres poèmes, histoires ou essais en quelques clics.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-semibold mb-2">💬 Communauté</h2>
          <p className="text-gray-600">
            Interagissez avec d’autres passionnés de littérature et construisez votre réseau.
          </p>
        </div>
      </section>
    </Layout>
  );
}