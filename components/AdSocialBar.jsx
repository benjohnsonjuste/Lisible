"use client";

import { useEffect } from "react";

/**
 * Composant AdSocialBar
 * À placer idéalement dans votre Layout principal (app/layout.js)
 * pour qu'il soit actif sur toutes les pages du site.
 */
export default function AdSocialBar() {
  useEffect(() => {
    // Éviter l'injection multiple si le composant est rendu plusieurs fois
    const scriptId = "ad-social-bar-script";
    if (document.getElementById(scriptId)) return;

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://pl28594689.profitablecpmratenetwork.com/62/bc/8f/62bc8f4d06d16b0f6d6297a4e94cfdfd.js";
    script.async = true;
    
    // Ajout à la fin du body pour ne pas impacter le LCP (Largest Contentful Paint)
    document.body.appendChild(script);

    return () => {
      // Nettoyage optionnel lors du démontage (navigation interne)
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  // Ce composant ne rend rien visuellement, il gère uniquement le script
  return null;
}
