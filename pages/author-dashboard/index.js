// pages/author-dashboard/index.js
import React from "react";
import QuickActions from "@/components/QuickActions";
import RecentActivity from "@/components/RecentActivity";
import TextLibrary from "@/components/TextLibrary";
import Button from "@/components/ui/Button"; // ✅ Ajout de l'import manquant

const AuthorDashboard = () => {
  return (
    <div className="p-6 space-y-12">
      {/* Haut du dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne gauche : Actions rapides */}
        <div className="space-y-8">
          <h2 className="text-xl font-semibold text-gray-900">
            Actions rapides
          </h2>
          <QuickActions />
        </div>

        {/* Colonne droite : Activité récente */}
        <div className="lg:col-span-2 space-y-8">
          <h2 className="text-xl font-semibold text-gray-900">
            Activité récente
          </h2>
          <RecentActivity />
        </div>
      </div>

      {/* Section inférieure - Bibliothèque de textes */}
      <div className="mt-12 bg-white border border-gray-200 shadow-sm rounded-lg p-6">
        <div className="text-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Votre bibliothèque
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Publiez régulièrement du contenu de qualité pour attirer plus
            d’abonnés et développer votre lectorat.
          </p>
        </div>
        <TextLibrary />
        {/* Exemple d'utilisation du bouton si nécessaire */}
        {/* <div className="mt-6 text-center">
          <Button>Ajouter un texte</Button>
        </div> */}
      </div>
    </div>
  );
};

export default AuthorDashboard;