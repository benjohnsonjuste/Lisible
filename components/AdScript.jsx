"use client";

import { useEffect } from "react";

export default function AdScript() {
  useEffect(() => {
    // Empêche l'ajout du script en double
    const existingScript = document.getElementById("ads-script");
    if (existingScript) return;

    const script = document.createElement("script");
    script.id = "ads-script";
    script.type = "text/javascript";
    script.src = "//pl27639698.effectivegatecpm.com/bd/73/cf/bd73cff968386b2fc7d844b5273c6d75.js";
    script.async = true;

    document.body.appendChild(script);

    return () => {
      const el = document.getElementById("ads-script");
      if (el) document.body.removeChild(el);
    };
  }, []);

  return (
    <div className="my-6 w-full flex flex-col items-center">
      <p className="text-sm text-gray-500 italic mb-2">Publicité</p>

      {/* Conteneur utile si la régie publicitaire injecte du contenu */}
      <div id="ads-container" className="w-full flex justify-center"></div>
    </div>
  );
}