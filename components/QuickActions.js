"use client";
import React from "react";
import { useRouter } from "next/router";
import { PenTool, User, BarChart3 } from "lucide-react";

export default function QuickActions() {
  const router = useRouter();

  const quickActionItems = [
    {
      title: "Publier un nouveau texte",
      description: "Partagez gratuitement sur Lisible",
      icon: <PenTool className="text-primary" size={25} />,
      bgColor: "bg-blue-100",
      action: () => router.push("/publish"),
    },
    {
      title: "Gérer mon compte",
      description: "Modifiez vos informations personnelles",
      icon: <User className="text-secondary" size={25} />,
      bgColor: "bg-pink-100",
      action: () => router.push("/account"),
    },
    {
      title: "Analyser les performances",
      description: "Consultez vos statistiques détaillées",
      icon: <BarChart3 className="text-accent" size={25} />,
      bgColor: "bg-accent/10",
      action: () => router.push("/analytics"),
    },
  ];

  return (
    <div className="bg-card border rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-6">Tableau de bord</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickActionItems.map((item, idx) => (
          <button
            key={idx}
            onClick={item.action}
            className={`flex flex-col items-start p-4 rounded-xl shadow-sm hover:shadow-md transition-all ${item.bgColor}`}
          >
            <div className="mb-3">{item.icon}</div>
            <h3 className="text-lg font-bold">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
