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
        // Nettoyage préalable
        container.innerHTML = "";

        // Étape 1 : Configuration des options globales requises par invoke.js
        window.atOptions = {
          'key' : '874a186feecd3e968c16a58bb085fd56',
          'format' : 'iframe',
          'height' : 250,
          'width' : 300,
          'params' : {}
        };

        // Étape 2 : Création du script d'appel principal
        const script = document.createElement("script");
        script.type = "text/javascript";
        script.src = "//pl28554024.effectivegatecpm.com/874a186feecd3e968c16a58bb085fd56/invoke.js";
        
        // Étape 3 : Ajout du script de tracking/supplémentaire
        const extraScript = document.createElement("script");
        extraScript.type = "text/javascript";
        extraScript.src = "https://pl28594689.effectivegatecpm.com/62/bc/8f/62bc8f4d06d16b0f6d6297a4e94cfdfd.js";
        extraScript.async = true;

        // Injection dans le conteneur spécifique
        container.appendChild(script);
        document.body.appendChild(extraScript);
      }

      return () => {
        if (container) container.innerHTML = "";
        // Nettoyage optionnel du script extra s'il existe
      };
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="my-8 flex justify-center w-full animate-in fade-in duration-700">
      <div className="relative bg-slate-900 border border-slate-800 p-3 rounded-[2.5rem] shadow-2xl">
        
        {/* Barre de contrôle */}
        <div className="flex items-center justify-between px-4 mb-2">
          <div className="flex items-center gap-1.5">
            <Sparkles size={10} className="text-teal-500" />
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Sponsorisé</span>
          </div>
          <button 
            onClick={() => setIsVisible(false)} 
            className="text-slate-600 hover:text-rose-400 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Zone de rendu 300x250 - Structure renforcée pour éviter les débordements */}
        <div className="bg-black/40 rounded-[1.8rem] overflow-hidden flex items-center justify-center border border-white/5 min-w-[320px] min-h-[270px]">
           <div 
             id="container-874a186feecd3e968c16a58bb085fd56" 
             className="w-[300px] h-[250px] flex justify-center items-center"
           >
             {/* L'iframe Adsterra s'injecte ici via invoke.js */}
           </div>
        </div>

        {/* Label de soutien */}
        <div className="mt-3 text-center">
          <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest opacity-80">
            Soutenez la littérature gratuite
          </p>
        </div>
      </div>
    </div>
  );
}
