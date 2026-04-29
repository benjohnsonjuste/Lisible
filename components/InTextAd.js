"use client";

import React, { useState, useEffect, useId } from "react";
import { X, Sparkles } from "lucide-react";

/**
 * Composant de publicité native intégrée au texte (In-Text).
 * Format optimisé pour un affichage en largeur "normale longue".
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

        // Étape 1 : Configuration des options globales
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
        
        // Étape 3 : Ajout du script de tracking
        const extraScript = document.createElement("script");
        extraScript.type = "text/javascript";
        extraScript.src = "https://pl28594689.effectivegatecpm.com/62/bc/8f/62bc8f4d06d16b0f6d6297a4e94cfdfd.js";
        extraScript.async = true;

        container.appendChild(script);
        document.body.appendChild(extraScript);
      }

      return () => {
        if (container) container.innerHTML = "";
      };
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="my-12 flex justify-center w-full animate-in fade-in duration-700">
      {/* Container élargi pour une dimension "longue" équilibrée */}
      <div className="relative bg-slate-900 border border-slate-800 p-4 rounded-[2rem] shadow-2xl w-full max-w-2xl">
        
        {/* Barre de contrôle */}
        <div className="flex items-center justify-between px-4 mb-3">
          <div className="flex items-center gap-1.5">
            <Sparkles size={10} className="text-teal-500" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Contenu Sponsorisé</span>
          </div>
          <button 
            onClick={() => setIsVisible(false)} 
            className="text-slate-600 hover:text-rose-400 transition-colors p-1"
          >
            <X size={16} />
          </button>
        </div>

        {/* Zone de rendu - Dimension "longue normale" pour l'intégration */}
        <div className="bg-black/20 rounded-2xl overflow-hidden flex items-center justify-center border border-white/5 min-h-[280px] w-full">
           <div 
             id="container-874a186feecd3e968c16a58bb085fd56" 
             className="w-[300px] h-[250px] flex justify-center items-center"
           >
             {/* L'iframe s'injecte ici */}
           </div>
        </div>

        {/* Label de soutien */}
        <div className="mt-3 flex justify-center items-center gap-2">
          <div className="h-[1px] w-8 bg-slate-800" />
          <p className="text-[8px] font-bold text-slate-600 uppercase tracking-[0.2em] opacity-80">
            Soutien aux auteurs
          </p>
          <div className="h-[1px] w-8 bg-slate-800" />
        </div>
      </div>
    </div>
  );
}
