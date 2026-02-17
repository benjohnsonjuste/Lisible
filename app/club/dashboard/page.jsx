"use client";
import { useState } from "react";
import ClubDashboard from "@/components/ClubDashboard"; // Utilise le code du dashboard généré précédemment

export default function HostPage({ currentUser }) {
  // Ici vous récupérez votre user via votre système de session existant
  const user = { name: "Ben Johnson", email: "ben@lisible.com", avatar: "..." };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
      <div className="w-full max-w-xl animate-in fade-in zoom-in duration-500">
        <ClubDashboard currentUser={user} />
      </div>
    </div>
  );
}
