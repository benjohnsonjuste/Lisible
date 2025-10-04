// pages/author-dashboard/text-publishing/index.js
"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";

export default function TextPublishingPage() {
  const { user } = useAuth();

  if (!user) {
    return <p>Veuillez vous connecter pour publier un texte.</p>;
  }

  return (
    <div className="flex gap-6">
      <aside className="w-72">
        {/* Sidebar de publication (PublishingSidebar) */}
      </aside>

      <main className="flex-1">
        <h1 className="text-xl font-bold mb-4">Publier un texte</h1>
        {/* Editor / formulaire de publication */}
      </main>
    </div>
  );
}