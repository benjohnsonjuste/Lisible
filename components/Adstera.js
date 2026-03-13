"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";

/**
 * Composant de publicité Adstera.
 * Version épurée conservant uniquement le script de diffusion principal.
 */
export default function Adstera() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (isVisible) {
      const containerId = "ad-special-container";
      const container = document.getElementById(containerId);
      
      if (container) {
        // Reset du conteneur pour éviter les doublons au rafraîchissement
        container.innerHTML = "";

        // Ajout du script de diffusion Adsterra
        const script = document.createElement("script");
        script.type = "text/javascript";
        script.src = "https://pl28594689.effectivegatecpm.com/62/bc/8f/62bc8f4d06d16b0f6d6297a4e94cfdfd.js";
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
      <div className="relative bg-slate-900 border border-slate-800 p-2 rounded-[2.2rem] shadow-2xl overflow-hidden">
        
        {/* Barre de contrôle */}
        <div className="flex items-center justify-between px-4 mb-2">
          <div className="flex items-center gap-1.5">
            <Sparkles size={10} className="text-teal-500" />
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Espace Mécène</span>
          </div>
          <button 
            onClick={() => setIsVisible(false)} 
            className="text-slate-600 hover:text-rose-400 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Zone de rendu du script */}
        <div className="bg-black/20 rounded-[1.5rem] overflow-hidden flex items-center justify-center border border-white/5 min-h-[50px] min-w-[200px]">
           <div 
             id="ad-special-container" 
             className="flex justify-center items-center"
           >
             {/* Le script Adsterra injecte son contenu ici */}
           </div>
        </div>

        {/* Label de soutien */}
        <div className="mt-2 text-center">
          <p className="text-[7px] font-bold text-slate-700 uppercase tracking-tighter">
            Votre lecture soutient la communauté
          </p>
        </div>
      </div>
    </div>
  );
}
