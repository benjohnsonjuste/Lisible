// pages/author-dashboard/text-publishing.js
"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import PublishingSidebar from "@/components/PublishingSidebar";

export default function TextPublishing() {
  const { user } = useAuth();

  if (!user) {
    return <p>Veuillez vous connecter pour publier un texte.</p>;
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <PublishingSidebar user={user} />
      <div className="flex-1">
        {/* Contenu principal de la publication */}
        <h1 className="text-xl font-bold mb-4">Publier un texte</h1>
      </div>
    </div>
  );
}