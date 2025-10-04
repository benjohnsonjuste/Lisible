"use client";

import React, { useEffect, useState } from "react";
import TextLibrary from "@/components/TextLibrary";

export default function LibraryPage() {
  const [texts, setTexts] = useState([]);

  // Optionnel : on pourrait charger ici les textes pour les passer à TextLibrary
  useEffect(() => {
    // (La logique est déjà dans TextLibrary, donc ce useEffect est juste pour futur usage)
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">
        📚 Bibliothèque Lisible
      </h1>

      {/* Section affichage des textes publiés */}
      <div className="mt-6">
        <TextLibrary />
      </div>
    </div>
  );
}