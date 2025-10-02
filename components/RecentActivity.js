import React, { useState, useEffect } from "react";
import { UserPlus, Eye, FileText, Trophy } from "lucide-react";

/**
 * RecentActivity : Historique des dernières activités de l’auteur
 */
export default function RecentActivity() {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    // ⚡ Simuler quelques activités récentes (exemple statique)
    const simulatedActivities = [
      {
        id: 1,
        message: "Maria Dubois s’est abonnée à vos publications",
        icon: <UserPlus className="text-green-600" size={22} />,
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // il y a 5 minutes
      },
      {
        id: 2,
        message: "“Les Murmures de Montmartre” a atteint 800 vues",
        icon: <Eye className="text-blue-600" size={22} />,
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // il y a 30 minutes
      },
      {
        id: 3,
        message: 'Votre nouveau texte "Réflexions sur l’Art Moderne" a été publié',
        icon: <FileText className="text-primary" size={22} />,
        timestamp: new Date(Date.now() - 60 * 60 * 1000), // il y a 1h
      },
      {
        id: 4,
        message: "🎉 Félicitations ! Vous avez atteint 180 abonnés",
        icon: <Trophy className="text-yellow-500" size={22} />,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // il y a 2h
      },
      {
        id: 5,
        message: "Jean Martin s’est abonné à vos publications",
        icon: <UserPlus className="text-green-600" size={22} />,
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // il y a 3h
      },
    ];

    setActivities(simulatedActivities);
  }, []);

  // ⏱ Fonction pour formater le temps écoulé
  const formatTimeAgo = (date) => {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return `${diff} sec`;
    if (diff < 3600) return `${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
    return `${Math.floor(diff / 86400)} j`;
  };

  return (
    <div className="bg-card border rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-6">Activité récente</h2>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition"
          >
            <div className="flex-shrink-0">{activity.icon}</div>
            <div className="flex-1">
              <p className="text-sm">{activity.message}</p>
              <span className="text-xs text-muted-foreground">
                {formatTimeAgo(activity.timestamp)} ago
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}