"use client";

import React from "react";
import PublishedTextsOverview from "@/components/PublishedTextsOverview";

export default function PublishedTextsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">
        Tous les textes publiés
      </h1>

      <PublishedTextsOverview />
    </div>
  );
}