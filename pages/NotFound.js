// pages/NotFound.js
import React from "react";
import { useRouter } from "next/router";
import Bouton from "@/components/ui/Bouton";
import AppIcon from "@/components/AppIcon";

const NotFound = () => {
const router = useRouter();
router.push('/some-path');

  const handleGoHome = () => {
    navigate("/"); // redirection vers la page d'accueil
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="text-center">
        <div className="relative mb-6">
          <h1 className="text-9xl font-bold text-primary opacity-20">404</h1>
        </div>
        <h2 className="text-2xl font-medium mb-2">Page non trouvée</h2>
        <p className="text-onBackground mb-6">
          La page que vous recherchez n’existe pas ou ne fonctionne plus.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Bouton
            variante="primaire"
            icones={<AppIcon nom="ArrowLeft" />}
            iconPosition="gauche"
            onClick={handleGoHome}
          >
            Retour
          </Bouton>
        </div>
      </div>
    </div>
  );
};

export default NotFound;