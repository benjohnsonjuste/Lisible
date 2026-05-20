"use client";
import React, { useEffect, useRef } from "react";

export default function InTextAd() {
  const adContainerRef = useRef(null);
  const scriptInjectedRef = useRef(false);

  useEffect(() => {
    // Évite les injections multiples si le composant se re-rendre
    if (scriptInjectedRef.current) return;

    const containerId = "container-874a186feecd3e968c16a58bb085fd56";
    
    // On s'assure que le conteneur est présent dans le DOM
    if (document.getElementById(containerId)) {
      const script = document.createElement("script");
      script.async = true;
      script.setAttribute("data-cfasync", "false");
      script.src = "https://pl28554024.effectivecpmnetwork.com/874a186feecd3e968c16a58bb085fd56/invoke.js";
      
      // On injecte le script juste après le conteneur publicitaire
      adContainerRef.current?.appendChild(script);
      scriptInjectedRef.current = true;
    }

    // Nettoyage optionnel au démontage du composant
    return () => {
      if (adContainerRef.current) {
        adContainerRef.current.innerHTML = "";
      }
      scriptInjectedRef.current = false;
    };
  }, []);

  return (
    <div className="w-full my-8 flex flex-col items-center justify-center clear-both">
      {/* Label discret pour indiquer la publicité (optionnel mais recommandé pour l'UX) */}
      <span className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-2">
        Sponsorisé
      </span>
      
      {/* Le conteneur requis par votre régie Adsterra */}
      <div 
        ref={adContainerRef}
        id="container-874a186feecd3e968c16a58bb085fd56" 
        className="w-full min-h-[150px] bg-slate-50/50 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100/50"
      />
    </div>
  );
}
