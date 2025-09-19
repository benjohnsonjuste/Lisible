import Link from "next/link";

export default function Home() {
  return (
    <main style={{ textAlign: "center", padding: "40px 20px" }}>
      {/* 🎯 SECTION HERO */}
      <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", marginBottom: "20px" }}>
        Bienvenue sur <span style={{ color: "#0070f3" }}>Lisible</span>
      </h1>
      <p style={{ fontSize: "1.2rem", maxWidth: "700px", margin: "0 auto 30px" }}>
        Lisible est la plateforme moderne où auteurs et lecteurs se connectent.
        Publiez vos textes, développez votre audience, suivez vos auteurs préférés
        et soutenez la littérature de demain.
      </p>

      {/* ✅ CTA */}
      <Link href="/login">
        <button style={{ fontSize: "1.1rem", padding: "12px 24px", marginBottom: "40px" }}>
          Commencer maintenant
        </button>
      </Link>

      {/* 🌟 AVANTAGES */}
      <section style={{ display: "grid", gap: "20px", maxWidth: "900px", margin: "0 auto" }}>
        <div style={cardStyle}>
          <h2>Pour les Lecteurs</h2>
          <p>
            Découvrez de nouveaux talents, abonnez-vous à vos auteurs préférés et
            suivez facilement leurs nouvelles publications.
          </p>
        </div>

        <div style={cardStyle}>
          <h2>Pour les Auteurs</h2>
          <p>
            Publiez vos textes facilement, construisez une communauté et débloquez
            la monétisation dès <b>250 abonnés</b>.
          </p>
        </div>

        <div style={cardStyle}>
          <h2>Suivi Automatique</h2>
          <p>
            Lisible compte automatiquement les vues de vos textes et vous donne des
            statistiques précises sur vos lecteurs.
          </p>
        </div>
      </section>
    </main>
  );
}

const cardStyle = {
  background: "#fff",
  border: "1px solid #eee",
  padding: "20px",
  borderRadius: "10px",
  boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
  textAlign: "center",
};