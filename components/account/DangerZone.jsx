import React, { useState } from "react";

export default function DangerZone({ userId }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handleRequestDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/account/delete-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        setFeedback(
          "Un email de confirmation vous a été envoyé. Veuillez cliquer sur le lien dans les 24 heures pour finaliser la suppression de votre compte."
        );
      } else {
        setFeedback("Échec de l'envoi de l'email. Veuillez réessayer.");
      }
    } catch (err) {
      setFeedback("Erreur réseau. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-red-600">Zone critique</h2>
      <p className="text-sm text-gray-700">
        Cette section vous permet de demander la suppression de votre compte Lisible. Un email de confirmation vous sera envoyé pour valider cette action irréversible.
      </p>

      <button
        onClick={() => setConfirmOpen(true)}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
      >
        Demander la suppression du compte
      </button>

      {confirmOpen && (
        <div className="mt-4 border border-red-300 p-4 rounded bg-red-50">
          <p className="text-sm text-red-700 mb-3">
            Êtes-vous certain de vouloir demander la suppression de votre compte ?
          </p>
          <div className="flex space-x-4">
            <button
              onClick={handleRequestDelete}
              disabled={loading}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              {loading ? "Envoi en cours…" : "Confirmer la demande"}
            </button>
            <button
              onClick={() => setConfirmOpen(false)}
              className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {feedback && (
        <div className="mt-4 text-sm text-gray-800 bg-gray-100 p-3 rounded">
          {feedback}
        </div>
      )}
    </div>
  );
}