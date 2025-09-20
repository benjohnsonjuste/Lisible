// pages/services.js
import Layout from "../components/Layout";
import ServiceCard from "../components/ServiceCard";
import { BookOpen, PenTool, BarChart3, DollarSign } from "lucide-react";

export default function Services() {
  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-4xl font-bold text-center mb-10">
          Nos Services
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ServiceCard
            icon={<BookOpen className="text-blue-600 w-10 h-10" />}
            title="Bibliothèque"
            description="Découvrez des textes inspirants, gratuits et accessibles à tous."
          />
          <ServiceCard
            icon={<PenTool className="text-green-600 w-10 h-10" />}
            title="Publication"
            description="Publiez vos œuvres et atteignez une audience mondiale."
          />
          <ServiceCard
            icon={<BarChart3 className="text-purple-600 w-10 h-10" />}
            title="Statistiques"
            description="Suivez vos lecteurs et vos abonnés en temps réel."
          />
          <ServiceCard
            icon={<DollarSign className="text-yellow-600 w-10 h-10" />}
            title="Monétisation"
            description="Gagnez de l’argent à partir de 250 abonnés sur votre profil."
          />
        </div>
      </div>
    </Layout>
  );
}