"use client";
import React, { useEffect, useRef } from 'react';

export const InTextAd = () => {
  const adRef = useRef(null);
  // Générer un ID unique si plusieurs InTextAd sont utilisés
  const scriptId = useRef(`ad-native-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    // Nettoyage de sécurité si le script existe déjà
    const existing = document.getElementById(scriptId.current);
    if (existing) existing.remove();

    // Création du script publicitaire
    const script = document.createElement("script");
    script.id = scriptId.current;
    script.src = "//pl27914784.profitablecpmratenetwork.com/fe/76/e8/fe76e8fd5162320316a889ed12f1364a.js";
    script.async = true;
    
    // Pour Adsterra, il est crucial que le script soit injecté 
    // à l'endroit précis où la bannière doit apparaître.
    if (adRef.current) {
      adRef.current.appendChild(script);
    }

    return () => {
      // On retire le script au démontage pour éviter les doublons lors de la navigation SPA
      const toRemove = document.getElementById(scriptId.current);
      if (toRemove) toRemove.remove();
    };
  }, []);

  return (
    <div className="my-16 flex flex-col items-center w-full">
      <div className="flex items-center gap-4 w-full mb-6">
        <div className="h-[1px] grow bg-slate-100" />
        <span className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-300">
          Espace Culturel Sponsorisé
        </span>
        <div className="h-[1px] grow bg-slate-100" />
      </div>
      
      {/* Conteneur principal de l'annonce */}
      <div 
        className="w-full min-h-[280px] bg-slate-50/30 rounded-[2rem] border border-dashed border-slate-200 flex items-center justify-center overflow-hidden"
      >
        <div 
          ref={adRef} 
          className="w-full h-full flex justify-center"
        >
          {/* Le script Adsterra injectera l'iframe/le contenu ici */}
        </div>
      </div>
      
      <p className="mt-4 text-[7px] text-slate-300 italic uppercase tracking-widest">
        Soutenez nos auteurs en découvrant nos partenaires
      </p>
    </div>
  );
};
