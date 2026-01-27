"use client";
import React, { useState, useEffect, useRef } from "react";
import { X, Sparkles } from "lucide-react";

export function InTextAd() {
  const [isVisible, setIsVisible] = useState(true);
  const adContainerRef = useRef(null);

  useEffect(() => {
    if (isVisible && adContainerRef.current) {
      // Nettoyage au cas où le script existerait déjà
      adContainerRef.current.innerHTML = "";
      const script = document.createElement("script");
      script.src = "https://pl28554024.effectivegatecpm.com/874a186feecd3e968c16a58bb085fd56/invoke.js";
      script.async = true;
      adContainerRef.current.appendChild(script);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="my-10 animate-in fade-in zoom-in duration-700">
      <div className="max-w-xl mx-auto bg-slate-900/95 backdrop-blur-xl border border-white/10 p-3 rounded-[2.5rem] shadow-2xl flex flex-col gap-3">
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
          <button onClick={() => setIsVisible(false)} className="p-2 text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Zone de la pub réelle */}
        <div className="bg-white/5 rounded-[1.8rem] overflow-hidden min-h-[120px] flex items-center justify-center relative border border-white/5">
           <div ref={adContainerRef} id="container-874a186feecd3e968c16a58bb085fd56" className="w-full">
             {/* Le script injectera la pub ici */}
           </div>
        </div>
      </div>
    </div>
  );
}
