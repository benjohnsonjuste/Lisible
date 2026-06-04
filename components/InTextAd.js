"use client";

import React, { useEffect, useRef } from "react";

const InTextAd = () => {
  const containerRef = useRef(null);
  const initialized = useRef(false);

  useEffect(() => {
    // Évite la double initialisation en mode Strict Mode de React
    if (initialized.current || !containerRef.current) return;
    initialized.current = true;

    try {
      const script = document.createElement("script");
      
      // Injection de la fonction exigée par le script publicitaire
      script.innerHTML = `
        (function(s){
          s.dataset.zone='11101873';
          s.src='https://nap5k.com/tag.min.js';
        })([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')));
      `;

      containerRef.current.appendChild(script);
    } catch (error) {
      console.error("Erreur lors de l'injection du script InTextAd:", error);
    }
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full flex justify-center my-8 min-h-[100px] clear-both"
      data-ad-zone="11101873"
    />
  );
};

export default InTextAd;
