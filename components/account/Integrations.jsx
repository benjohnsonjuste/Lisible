import React from "react";

export default function Integrations({ userId }) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Intégrations</h2>
      <p>Connectez vos outils externes (Google Analytics, Stripe, etc.)</p>
      {/* Exemple de bouton d'intégration */}
      <button className="btn-secondary mt-4">Connecter Stripe</button>
    </div>
