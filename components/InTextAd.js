"use client";

import React, { useState, useEffect, useId } from "react";
import { X, Sparkles } from "lucide-center";

/**
 * Composant de publicité native intégrée au texte (In-Text).
 * Format optimisé pour s'insérer entre les paragraphes.
 */
export function InTextAd() {
  const [isVisible, setIsVisible] = useState(true);
  const instanceId = useId().replace(/:/g, "");

  useEffect(() => {
    if (isVisible) {
      window.atOptions = {
        'key' : '874a186feecd3e968c16a58bb085fd56',
        'format' : 'iframe',
        'height' : 250,
        'width' : 300,
        'params' : {}
      };

      const script = document.createElement("script");
      script.src = "//pl28554024.effectivegatecpm.com/874a186feecd3e968c16a58bb085fd56/invoke.js";
      script.async = true;
      script.setAttribute("data-cfasync", "false");
      
      const container = document.getElementById("container-874a186feecd3e968c16a58bb085fd56");
      if (container) {
        container.appendChild(script);
      }

      return () => {
        if (container) {
          container.innerHTML = "";
        }
      };
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="my-6 sm:my-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 px-2 flex justify-center">
      <div className="w-full max-w-[340px] bg-slate-900 border border-slate-800 p-1.5 rounded-[2rem] shadow-xl flex flex-col gap-1.5">
        
        {/* Header minimaliste pour intégration texte */}
        <div className="flex items-center justify-between px-3 pt-1">
          <div className="flex items-center gap-2">
            <Sparkles size={10} className="text-teal-500 animate-pulse" />
            <p className="text-slate-500 text-[7px] font-black uppercase tracking-[0.2em]">Espace Mécène</p>
          </div>
          <button 
            onClick={() => setIsVisible(false)} 
            className="text-slate-600 hover:text-rose-400 transition-colors"
            aria-label="Fermer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Zone Pub (Strict 300x250) */}
        <div className="bg-white/5 rounded-[1.4rem] overflow-hidden min-h-[250px] flex items-center justify-center relative border border-white/5">
           <div 
             id="container-874a186feecd3e968c16a58bb085fd56" 
             className="w-[300px] h-[250px] z-10 flex justify-center items-center"
           >
             {/* Injection Ad */}
           </div>
           
           <div className="absolute inset-0 flex items-center justify-center -z-0">
             <p className="text-[7px] font-bold uppercase tracking-widest text-slate-800">
               Soutien Littéraire...
             </p>
           </div>
        </div>

        {/* Note de bas d'annonce */}
        <div className="pb-1">
          <p className="text-[6px] font-medium text-slate-700 text-center uppercase tracking-tighter">
            Merci de soutenir la gratuité de Lisible
          </p>
        </div>
      </div>
    </div>
  );
}
