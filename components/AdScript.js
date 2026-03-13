"use client";
import React, { useEffect } from "react";

/**
 * Composant AdScript
 * Injecte le script publicitaire Adsterra de manière sécurisée.
 */
const AdScript = () => {
  useEffect(() => {
    // Empêcher l'injection multiple si le composant est re-rendu
    const scriptId = "adsterra-script-f3ab7f75";
    if (document.getElementById(scriptId)) return;

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://pl28553504.effectivegatecpm.com/f3/ab/7f/f3ab7f753d7d49a90e198d67c43c6991.js";
    script.async = true;
    script.type = "text/javascript";

    // Ajout au corps du document
    document.body.appendChild(script);

    return () => {
      // Nettoyage optionnel lors du démontage du composant
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return null; // Ce composant ne rend rien visuellement, il gère uniquement le script
};

export default AdScript;
