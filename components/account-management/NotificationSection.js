// components/account-management/NotificationSection.jsx
import React, { useState } from "react";
import Bouton from "@/components/ui/Bouton";
import Checkbox from "@/components/ui/Checkbox";
import AppIcon from "@/components/AppIcon";

const NotificationSection = ({ onNotificationUpdate }) => {
  const [emailNotifications, setEmailNotifications] = useState({
    nouveauxAbonnes: true,
    voirMilestones: true,
    rapportsHebdomadaires: false,
    rapportsMensuels: true,
    commentaires: true,
    misesAJourSysteme: false,
    marketingEmails: false,
  });

  const [pushNotifications, setPushNotifications] = useState({
    pushNewSubscribers: false,
    pushMilestones: true,
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleEmailChange = (key) => {
    setEmailNotifications({ ...emailNotifications, [key]: !emailNotifications[key] });
  };

  const handlePushChange = (key) => {
    setPushNotifications({ ...pushNotifications, [key]: !pushNotifications[key] });
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Simuler un appel API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onNotificationUpdate({ emailNotifications, pushNotifications });
    } catch (error) {
      console.error("Erreur lors de la mise à jour des notifications", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-blue-50 rounded-lg space-y-6">
      <h2 className="text-xl font-bold text-blue-700 mb-4">Notifications</h2>

      {/* Notifications par e-mail */}
      <div className="border p-4 rounded-lg bg-blue-100 space-y-2">
        <h3 className="font-semibold text-blue-800 mb-2">Notifications par e-mail</h3>
        {Object.keys(emailNotifications).map((key) => (
          <Checkbox
            key={key}
            checked={emailNotifications[key]}
            onChange={() => handleEmailChange(key)}
          >
            {key
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, (str) => str.toUpperCase())}
          </Checkbox>
        ))}
      </div>

      {/* Notifications push */}
      <div className="border p-4 rounded-lg bg-blue-200 space-y-2">
        <h3 className="font-semibold text-blue-900 mb-2">Notifications Push</h3>
        {Object.keys(pushNotifications).map((key) => (
          <Checkbox
            key={key}
            checked={pushNotifications[key]}
            onChange={() => handlePushChange(key)}
          >
            {key
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, (str) => str.toUpperCase())}
          </Checkbox>
        ))}
      </div>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end mt-4">
        <Bouton variante="primary" onClick={handleSave} disabled={isLoading}>
          {isLoading ? "Enregistrement..." : "Enregistrer les modifications"}
        </Bouton>
      </div>
    </div>
  );
};

export default NotificationSection;