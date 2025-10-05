"use client";

import React from "react";
import ContentLibrary from "@/components/ui/ContentLibrary";

export default function LibraryPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-8 text-center">
        <p className="text-muted-foreground">
          Découvrez tous les textes publiés sur Lisible.
        </p>
      </header>

      {/* ✅ Section principale : affichage des textes */}
      <ContentLibrary />
    </div>
  );
}