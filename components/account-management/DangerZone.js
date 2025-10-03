// components/account-management/DangerZone.jsx
import React, { useState } from "react";
import Bouton from "@/components/ui/Bouton";
import Input from "@/components/ui/Input";
import Checkbox from "@/components/ui/Checkbox";
import AppIcon from "@/components/AppIcon";

const DangerZone = ({ onAccountAction }) => {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showDeactivateConfirmation, setShowDeactivateConfirmation] = useState(false);
  const [confirmationChecks, setConfirmationChecks] = useState({
    acknowledgeDelete: false,
    acknowledgeDeactivate: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleDeactivateAccount = async () => {
    setIsLoading(true);
    try {
      // Simuler un appel API
      await new Promise((resolve) => setTimeout(resolve, 2000));
      onAccountAction({ type: "désactiver", succès: true });
      setShowDeactivateConfirmation(false);
    } catch (erreur) {
      console.error("Erreur lors de la désactivation du compte", erreur);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      onAccountAction({ type: "supprimer", succès: true });
      setShowDeleteConfirmation(false);
    } catch (erreur) {
      console.error("Erreur lors de la suppression du compte", erreur);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-red-50 rounded-lg space-y-6">
      <h2 className="text-xl font-bold text-red-600">Danger Zone</h2>

      {/* Désactivation du compte */}
      <div className="border p-4 rounded-lg bg-red-100">
        <h3 className="font-semibold text-red-700 mb-2">Désactiver le compte</h3>
        <p className="mb-2">
          Vous pouvez désactiver votre compte temporairement. Vous pourrez le réactiver plus tard.
        </p>
        <Checkbox
          checked={confirmationChecks.acknowledgeDeactivate}
          onChange={(checked) =>
            setConfirmationChecks({ ...confirmationChecks, acknowledgeDeactivate: checked })
          }
        >
          Je comprends que mon compte sera désactivé.
        </Checkbox>
        <Bouton
          variante="danger"
          onClick={() => setShowDeactivateConfirmation(true)}
          disabled={!confirmationChecks.acknowledgeDeactivate || isLoading}
        >
          Désactiver
        </Bouton>
      </div>

      {/* Suppression du compte */}
      <div className="border p-4 rounded-lg bg-red-200">
        <h3 className="font-semibold text-red-800 mb-2">Supprimer le compte</h3>
        <p className="mb-2">
          La suppression du compte est irréversible et toutes vos données seront perdues.
        </p>
        <Checkbox
          checked={confirmationChecks.acknowledgeDelete}
          onChange={(checked) =>
            setConfirmationChecks({ ...confirmationChecks, acknowledgeDelete: checked })
          }
        >
          Je comprends que mon compte sera définitivement supprimé.
        </Checkbox>
        <Bouton
          variante="danger"
          onClick={() => setShowDeleteConfirmation(true)}
          disabled={!confirmationChecks.acknowledgeDelete || isLoading}
        >
          Supprimer
        </Bouton>
      </div>

      {/* Modales de confirmation */}
      {showDeactivateConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white p-6 rounded-lg space-y-4 w-full max-w-md">
            <h4 className="text-lg font-bold">Confirmer la désactivation</h4>
            <p>Êtes-vous sûr de vouloir désactiver votre compte ?</p>
            <div className="flex justify-end gap-4">
              <Bouton variante="secondary" onClick={() => setShowDeactivateConfirmation(false)}>
                Annuler
              </Bouton>
              <Bouton variante="danger" onClick={handleDeactivateAccount} disabled={isLoading}>
                {isLoading ? "Chargement..." : "Confirmer"}
              </Bouton>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white p-6 rounded-lg space-y-4 w-full max-w-md">
            <h4 className="text-lg font-bold">Confirmer la suppression</h4>
            <p>Êtes-vous sûr de vouloir supprimer définitivement votre compte ?</p>
            <div className="flex justify-end gap-4">
              <Bouton variante="secondary" onClick={() => setShowDeleteConfirmation(false)}>
                Annuler
              </Bouton>
              <Bouton variante="danger" onClick={handleDeleteAccount} disabled={isLoading}>
                {isLoading ? "Chargement..." : "Supprimer"}
              </Bouton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DangerZone;
