"use client";
import React, { useEffect, useRef } from 'react';

export const InTextAd = () => {
  const adRef = useRef(null);
  const scriptId = "adsterra-script";

  useEffect(() => {
    // Vérifier si le script existe déjà pour ne pas le recharger inutilement
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://pl27914784.profitablecpmratenetwork.com/fe/76/e8/fe76e8fd5162320316a889ed12f1364a.js";
      script.async = true;
      
      // On attache le script au container
      if (adRef.current) {
        adRef.current.appendChild(script);
      }
    }

    return () => {
      // Nettoyage optionnel au démontage du composant
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return (
    <div className="my-12 flex flex-col items-center">
      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300 mb-4">
        Sponsorisé
      </span>
      
      {/* Conteneur de l'annonce */}
      <div 
        ref={adRef} 
        className="ad-container w-full min-h-[250px] flex justify-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 overflow-hidden"
      >
        {/* Adsterra injectera l'annonce ici */}
      </div>
      
      <div className="h-[1px] w-24 bg-slate-100 mt-8" />
    </div>
  );
};
