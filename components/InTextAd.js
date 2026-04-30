"use client";

import React, { useEffect, useId } from "react";

/**
 * Composant AdNativeBanner
 * Conçu pour l'affichage de bannières natives/directes.
 */
export default function AdNativeBanner() {
  const instanceId = useId().replace(/:/g, "");
  const containerId = "container-874a186feecd3e968c16a58bb085fd56";

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Nettoyage du container pour éviter les doublons lors des navigations
    container.innerHTML = "";

    // Configuration globale requise par le réseau publicitaire
    window.atOptions = {
      key: "874a186feecd3e968c16a58bb085fd56",
      format: "iframe",
      height: 250,
      width: 300,
      params: {},
    };

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "//pl28554024.profitablecpmratenetwork.com/874a186feecd3e968c16a58bb085fd56/invoke.js";
    script.async = true;
    
    // Ajout du script au container
    container.appendChild(script);

    return () => {
      if (container) container.innerHTML = "";
    };
  }, [containerId]);

  return (
    <div className="my-8 flex flex-col items-center justify-center w-full">
      {/* Label discret */}
      <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 opacity-50">
        Sponsoring
      </span>
      
      {/* Container de la bannière */}
      <div 
        id={containerId} 
        className="min-h-[250px] w-full flex justify-center items-center overflow-hidden rounded-2xl bg-slate-50/50 border border-slate-100"
      />
    </div>
  );
}
