import Layout from "../components/Layout";
import ServiceCard from "../components/ServiceCard";

export default function Services() {
  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-4xl font-bold text-center mb-10">Nos Services</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ServiceCard
            icon={<svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h18M9 3v2m6-2v2m-7 6h8" /></svg>}
            title="Bibliothèque"
            description="Accédez à des textes inspirants, gratuits et ouverts à tous."
          />
          <ServiceCard
            icon={<svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 4h2a2 2 0 012 2v12a2 2 0 01-2 2h-2" /></svg>}
            title="Publication"
            description="Publiez vos œuvres en toute simplicité."
          />
          <ServiceCard
            icon={<svg className="w-10 h-10 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>}
            title="Statistiques"
            description="Observez vos lectures et vos abonnés en direct."
          />
          <ServiceCard
            icon={<svg className="w-10 h-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 2" /></svg>}
            title="Monétisation"
            description="Recevez des revenus grâce à vos abonnés."
          />
        </div>
      </div>
    </Layout>
  );
              }
