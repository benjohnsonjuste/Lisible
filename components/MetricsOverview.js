"use client";

import React, { useState, useEffect } from "react";
import { Rocket, Users, Eye, BookOpen, DollarSign } from "lucide-react";

export default function MetricsOverview({ userId }) {
  const [metrics, setMetrics] = useState({
    subscribers: 0,
    totalViews: 0,
    textsPublished: 0,
    totalEarnings: 0,
  });
  const [isMonetizationUnlocked, setIsMonetizationUnlocked] = useState(false);

  // Charger les métriques depuis l'API GitHub
  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch(`/api/author/${userId}/metrics`);
        if (!res.ok) throw new Error("Erreur lors de la récupération des métriques");
        const data = await res.json();

        const monetizationUnlocked = data.subscribers >= 250;
        const earnings = monetizationUnlocked ? (data.totalViews / 1000) * 0.2 : 0;

        setMetrics({
          subscribers: data.subscribers,
          totalViews: data.totalViews,
          textsPublished: data.textsPublished,
          totalEarnings: earnings.toFixed(2),
        });
        setIsMonetizationUnlocked(monetizationUnlocked);
      } catch (err) {
        console.error("Erreur fetch metrics:", err);
      }
    }

    fetchMetrics();
  }, [userId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Abonnés */}
      <MetricCard
        title="Abonnés"
        value={metrics.subscribers}
        icon={<Users className="text-blue-500" size={28} />}
      />

      {/* Vues totales */}
      <MetricCard
        title="Vues totales"
        value={metrics.totalViews}
        icon={<Eye className="text-green-500" size={28} />}
      />

      {/* Textes publiés */}
      <MetricCard
        title="Textes publiés"
        value={metrics.textsPublished}
        icon={<BookOpen className="text-purple-500" size={28} />}
      />

      {/* Gains totaux */}
      <MetricCard
        title="Gains totaux (USD)"
        value={metrics.totalEarnings}
        icon={<DollarSign className="text-yellow-500" size={28} />}
      />

      {/* Badge monétisation */}
      <div className="col-span-1 md:col-span-2 flex justify-center mt-4">
        {isMonetizationUnlocked ? (
          <div className="flex items-center space-x-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg">
            <Rocket size={20} /> <span>Monétisation débloquée 🚀</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-lg">
            <Rocket size={20} /> <span>Monétisation verrouillée</span>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon }) {
  return (
    <div className="p-4 border rounded-lg shadow-md bg-white">
      <div className="flex items-center space-x-3">
        {icon}
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}