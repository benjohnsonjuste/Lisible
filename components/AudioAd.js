"use client";

import React, { useEffect, useRef } from "react";

const AudioAd = () => {
  const containerRef = useRef(null);
  const initialized = useRef(false);

  useEffect(() => {
    // Évite le double chargement lié au Strict Mode de React en développement
    if (initialized.current || !containerRef.current) return;
    initialized.current = true;

    try {
      const script = document.createElement("script");
      
      // Injection de la fonction exigée pour la zone 11101873
      script.innerHTML = `
        (function(s){
          s.dataset.zone='11101873';
          s.src='https://nap5k.com/tag.min.js';
        })([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')));
      `;

      containerRef.current.appendChild(script);
    } catch (error) {
      console.error("Erreur lors de l'injection du script publicitaire audio:", error);
    }
  }, []);

  return (
    <div className="w-full flex flex-col items-center my-6">
      {/* Label discret conforme aux exigences de transparence publicitaire */}
      <span className="text-[9px] font-black tracking-[0.2em] uppercase text-slate-400 mb-2 block">
        Sponsorisé
      </span>
      
      {/* Conteneur de l'annonce */}
      <div 
        ref={containerRef} 
        className="w-full max-w-xl min-h-[100px] bg-slate-50/50 rounded-2xl border border-slate-100/80 p-2 flex justify-center items-center transition-all clear-both"
        data-ad-zone="11101873"
      />
    </div>
  );
};

export default AudioAd;
