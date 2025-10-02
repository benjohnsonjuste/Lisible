// components/PublierConfirmationModal.js
import React, { useState } from "react";
import AppIcon from "@/components/AppIcon";
import Bouton from "@/components/ui/Bouton";
import { Checkbox } from "@/components/ui/Checkbox";

const PublierConfirmationModal = ({
  isOpen,
  onClose,
  onConfirmer,
  publicationData, // { titre, contenu, imageUrl }
  isPublishing = false,
}) => {
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!agreedToTerms) return;
    onConfirmer();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
        {/* Bouton fermer */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          <AppIcon name="X" size={20} />
        </button>

        <h2 className="text-xl font-bold mb-4">Confirmer la publication</h2>

        {/* Aperçu de la publication */}
        {publicationData?.imageUrl && (
          <img
            src={publicationData.imageUrl}
            alt="Preview"
            className="w-full max-h-48 object-contain rounded mb-4"
          />
        )}
        <div className="mb-4">
          <h3 className="font-semibold">{publicationData?.titre}</h3>
          <p className="text-gray-700">
            {publicationData?.contenu.length > 100
              ? publicationData.contenu.slice(0, 100) + "..."
              : publicationData?.contenu}
          </p>
        </div>

        {/* Checkbox conditions */}
        <div className="mb-4 flex items-center space-x-2">
          <Checkbox
            checked={agreedToTerms}
            onChange={() => setAgreedToTerms(!agreedToTerms)}
          />
          <label className="text-sm text-gray-600">
            J’accepte les conditions et la monétisation.
          </label>
        </div>

        {/* Boutons */}
        <div className="flex justify-end space-x-2">
          <Bouton
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400"
          >
            Annuler
          </Bouton>
          <Bouton
            onClick={handleConfirm}
            disabled={!agreedToTerms || isPublishing}
            className={`${
              agreedToTerms ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300"
            } text-white`}
          >
            {isPublishing ? "Publication..." : "Confirmer"}
          </Bouton>
        </div>
      </div>
    </div>
  );
};

export default PublierConfirmationModal;