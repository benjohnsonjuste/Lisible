// components/InTextAd.jsx
"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";

/**
 * Composant de publicité native intégrée au texte.
 * Utilise un ID de conteneur spécifique requis par le script externe.
 */
export function InTextAd() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (isVisible) {
      // 1. Définition des paramètres requis par le script avant l'invocation
      window.atOptions = {
        'key' : '874a186feecd3e968c16a58bb085fd56',
        'format' : 'iframe',
        'height' : 250,
        'width' : 300,
        'params' : {}
      };

      // 2. Insertion du script externe
      const script = document.createElement("script");
      script.src = "//pl28554024.effectivegatecpm.com/874a186feecd3e968c16a58bb085fd56/invoke.js";
      script.async = true;
      script.setAttribute("data-cfasync", "false");
      
      const container = document.getElementById("container-874a186feecd3e968c16a58bb085fd56");
      if (container) {
        container.appendChild(script);
      }

      return () => {
        // Nettoyage au démontage
        if (container && container.contains(script)) {
          container.removeChild(script);
        }
      };
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="my-12 animate-in fade-in zoom-in duration-1000">
      <div className="max-w-xl mx-auto bg-slate-900 dark:bg-black/60 backdrop-blur-2xl border border-slate-800 dark:border-white/10 p-3 rounded-[2.5rem] shadow-2xl flex flex-col gap-3">
        
        {/* Header de l'annonce */}
        <div className="flex items-center justify-between px-4 pt-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-900/40">
              <Sparkles size={14} className="animate-pulse" />
            </div>
            <div>
              <p className="text-white text-[9px] font-black uppercase tracking-[0.2em] leading-none">Annonce Lisible</p>
              <p className="text-slate-400 text-[8px] italic font-medium mt-1">Soutenez la plume libre</p>
            </div>
          </div>
          <button 
            onClick={() => setIsVisible(false)} 
            className="p-2 text-slate-500 hover:text-rose-400 transition-colors focus:outline-none"
            aria-label="Fermer la publicité"
          >
            <X size={18} />
          </button>
        </div>

        {/* Zone de la publicité réelle */}
        <div className="bg-white/5 rounded-[1.8rem] overflow-hidden min-h-[250px] flex items-center justify-center relative border border-white/5">
           {/* L'ID DOIT CORRESPONDRE EXACTEMENT AU SCRIPT INVOKE.JS */}
           <div 
             id="container-874a186feecd3e968c16a58bb085fd56" 
             className="w-full flex justify-center py-2 min-h-[250px]"
           >
             {/* Le script injectera la pub ici */}
           </div>
        </div>
      </div>
    </div>
  );
}
