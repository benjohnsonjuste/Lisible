// pages/index.js
import Layout from "../components/Layout";
import Link from "next/link";

export default function HomePage() {
  return (
    <Layout>
      {/* ====== IMAGE DE COUVERTURE ====== */}
      <section className="relative w-full h-screen">
        <img
          src="/cover.jpg" // placer votre image de couverture dans /public
          alt="Couverture Lisible"
          className="cover-image"
        />
        <div className="cover-overlay">
          <h1>Bienvenue sur <span className="text-blue-400">Lisible</span></h1>
          <p>La plateforme où vous pouvez lire, publier et partager vos textes en toute simplicité.</p>
          <div className="mt-6">
            <Link href="/register">
              <a className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                S'inscrire
              </a>
            </Link>
          </div>
        </div>
      </section>

      {/* ====== PRÉSENTATION DU LABEL ====== */}
      <section className="section">
        <h2>La Belle Littéraire</h2>
        <p>La maison mère de Lisible, dédiée à la promotion de jeunes talents et à la diffusion de textes de qualité.</p>
      </section>

      {/* ====== BIENFAITS DE LA LECTURE ====== */}
      <section className="section">
        <h2>Les bienfaits de la lecture</h2>
        <p>
          La lecture améliore la concentration, stimule la créativité, enrichit le vocabulaire et offre un épanouissement personnel.
        </p>
      </section>

      {/* ====== BIENFAITS DE LISIBLE ====== */}
      <section className="section">
        <h2>Pourquoi choisir Lisible ?</h2>
        <p>
          Lisible vous permet de découvrir de nouveaux auteurs, de partager vos textes facilement et de rejoindre une communauté passionnée.
        </p>
      </section>

      {/* ====== AVANTAGES POUR LECTEURS ====== */}
      <section className="grid md:grid-cols-2 gap-6 p-10 max-w-6xl mx-auto">
        <div className="card">
          <h3>1 - Gratuité</h3>
          <p>Accédez à des centaines de textes gratuitement, sans restriction.</p>
        </div>
        <div className="card">
          <h3>2 - Exclusivité</h3>
          <p>Découvrez des textes exclusifs et inédits publiés par nos auteurs.</p>
        </div>
        <div className="card">
          <h3>3 - Communauté</h3>
          <p>Interagissez avec d’autres lecteurs et partagez vos impressions.</p>
        </div>
        <div className="card">
          <h3>4 - Découverte</h3>
          <p>Explorez de nouveaux genres et découvrez des talents émergents.</p>
        </div>
      </section>

      {/* ====== AVANTAGES POUR AUTEURS ====== */}
      <section className="grid md:grid-cols-2 gap-6 p-10 max-w-6xl mx-auto">
        <div className="card">
          <h3>1 - Liberté</h3>
          <p>Publiez vos textes comme vous le souhaitez, sans aucune restriction éditoriale.</p>
        </div>
        <div className="card">
          <h3>2 - Communauté</h3>
          <p>Recevez des retours constructifs de lecteurs et développez votre réseau d’auteurs.</p>
        </div>
        <div className="card">
          <h3>3 - Statistiques</h3>
          <p>Suivez en temps réel le nombre de lectures et l’engagement de vos abonnés.</p>
        </div>
        <div className="card">
          <h3>4 - Monétisation</h3>
          <p>Gagnez de l’argent dès que vous atteignez 250 abonnés sur votre profil.</p>
        </div>
        <div className="card">
          <h3>5 - Droits réservés</h3>
          <p>Tous vos textes restent votre propriété intellectuelle, protégés et respectés.</p>
        </div>
      </section>

      {/* ====== BOUTON INSCRIPTION AUTEURS ====== */}
      <section className="text-center p-10">
        <Link href="/register">
          <a className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            S'inscrire en tant qu'auteur
          </a>
        </Link>
      </section>
    </Layout>
  );
}