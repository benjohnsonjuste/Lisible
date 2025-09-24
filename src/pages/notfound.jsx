import React from "react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="text-center p-20">
      <h1 className="text-3xl font-bold mb-4">404 - Page non trouvée</h1>
      <Link to="/" className="text-blue-600">Retour à l'accueil</Link>
    </div>
  );
}
