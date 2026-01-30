"use client";
import React, { useState, useEffect, useRef } from "react";
import { X, Sparkles } from "lucide-react";

export function InTextAd() {
  const [isVisible, setIsVisible] = useState(true);
  const adContainerRef = useRef(null);

  useEffect(() => {
    if (isVisible) {
      // Insertion du script externe de manière sécurisée
      const script = document.createElement("script");
      script.src = "https://pl28554024.effectivegatecpm.com/874a186feecd3e968c16a58bb085fd56/invoke.js";
      script.async = true;
      script.setAttribute("data-cfasync", "false");
      
      // On l'ajoute au document
      document.head.appendChild(script);

      return () => {
        // Nettoyage si le composant est démonté
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="my-10 animate-in fade-in zoom-in duration-700">
      <div className="max-w-xl mx-auto bg-slate-900/95 backdrop-blur-xl border border-white/10 p-3 rounded-[2.5rem] shadow-2xl flex flex-col gap-3">
        
        {/* Header de l'annonce */}
        <div className="flex items-center justify-between px-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-white text-[10px] font-black uppercase tracking-widest leading-none">Annonce Lisible</p>
              <p className="text-slate-400 text-[9px] italic font-medium">Soutenez la communauté</p>
            </div>
          </div>
          <button 
            onClick={() => setIsVisible(false)} 
            className="p-2 text-slate-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Zone de la publicité réelle */}
        <div className="bg-white/5 rounded-[1.8rem] overflow-hidden min-h-[120px] flex items-center justify-center relative border border-white/5">
           {/* L'ID DOIT CORRESPONDRE EXACTEMENT AU SCRIPT INVOKE.JS */}
           <div 
             id="container-874a186feecd3e968c16a58bb085fd56" 
             className="w-full flex justify-center"
           >
             {/* Le script injectera la pub ici automatiquement grâce à l'ID */}
           </div>
        </div>
      </div>
    </div>
  );
}
