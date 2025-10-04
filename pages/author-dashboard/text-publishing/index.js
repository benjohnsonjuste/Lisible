"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import TextPublishingForm from "@/components/TextPublishingForm";

export default function TextPublishingPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">
          Veuillez vous connecter pour publier un texte.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <aside className="w-full lg:w-72 bg-muted p-4 rounded-md">
        <h2 className="font-semibold mb-3">🪶 Conseils de publication</h2>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>• Donnez un titre clair et inspirant</li>
          <li>• Utilisez un extrait court et accrocheur</li>
          <li>• Évitez les fautes d’orthographe 😉</li>
        </ul>
      </aside>

      <main className="flex-1">
        <h1 className="text-2xl font-bold mb-4">Publier un texte</h1>
        <TextPublishingForm />
      </main>
    </div>
  );
}