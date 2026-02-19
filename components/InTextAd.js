"use client";

import React, { useState, useEffect, useId } from "react";
import { X, Sparkles } from "lucide-react";

/**
 * Composant de publicité native intégrée au texte (In-Text).
 * Format optimisé 300x250 pour Adsterra.
 */
export function InTextAd() {
  const [isVisible, setIsVisible] = useState(true);
  const instanceId = useId().replace(/:/g, "");

  useEffect(() => {
    if (isVisible) {
      const containerId = "container-874a186feecd3e968c16a58bb085fd56";
      const container = document.getElementById(containerId);
      
      if (container) {
        // Reset du conteneur
        container.innerHTML = "";

        // Configuration Adsterra
        window.atOptions = {
          'key' : '874a186feecd3e968c16a58bb085fd56',
          'format' : 'iframe',
          'height' : 250,
          'width' : 300,
          'params' : {}
        };

        const script = document.createElement("script");
        script.type = "text/javascript";
        script.src = "//pl28554024.effectivegatecpm.com/874a186feecd3e968c16a58bb085fd56/invoke.js";
        script.async = true;
        
        container.appendChild(script);
      }

      return () => {
        if (container) container.innerHTML = "";
      };
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="my-8 flex justify-center w-full animate-in fade-in duration-700">
      <div className="relative bg-slate-900 border border-slate-800 p-2 rounded-[2.2rem] shadow-2xl">
        
        {/* Barre de contrôle */}
        <div className="flex items-center justify-between px-4 mb-2">
          <div className="flex items-center gap-1.5">
            <Sparkles size={10} className="text-teal-500" />
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Sponsor</span>
          </div>
          <button 
            onClick={() => setIsVisible(false)} 
            className="text-slate-600 hover:text-rose-400"
          >
            <X size={14} />
          </button>
        </div>

        {/* Zone de rendu 300x250 - Ne pas toucher aux dimensions */}
        <div className="bg-black/20 rounded-[1.5rem] overflow-hidden flex items-center justify-center border border-white/5">
           <div 
             id="container-874a186feecd3e968c16a58bb085fd56" 
             className="min-w-[300px] min-h-[250px] flex justify-center items-center"
           >
             {/* L'iframe Adsterra s'injecte ici */}
           </div>
        </div>

        {/* Label de soutien */}
        <div className="mt-2 text-center">
          <p className="text-[7px] font-bold text-slate-700 uppercase tracking-tighter">
            Lisible est gratuit grâce à nos mécènes
          </p>
        </div>
      </div>
    </div>
  );
}
