"use client";
import { useEffect } from "react";

export default function AdSense() {
  useEffect(() => {
    // Éviter les doublons
    if (document.getElementById("ads-script")) return;

    const script = document.createElement("script");
    script.id = "ads-script";
    script.type = "text/javascript";
    script.src = "//pl27639698.effectivegatecpm.com/bd/73/cf/bd73cff968386b2fc7d844b5273c6d75.js";
    script.async = true;

    document.body.appendChild(script);

    return () => {
      const el = document.getElementById("ads-script");
      if (el) el.remove();
    };
  }, []);

  return (
    <div className="my-12 w-full flex flex-col items-center animate-in fade-in duration-1000">
      <div className="flex items-center gap-3 w-full max-w-lg mb-4">
        <div className="h-[1px] flex-grow bg-slate-100"></div>
        <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Sponsorisé</span>
        <div className="h-[1px] flex-grow bg-slate-100"></div>
      </div>

      {/* Zone d'affichage de la pub avec design Lisible */}
      <div 
        id="ads-container" 
        className="w-full min-h-[100px] flex justify-center bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100 p-4 transition-all hover:bg-white hover:border-teal-100 shadow-inner"
      >
        {/* Le script injectera la pub ici */}
      </div>
    </div>
  );
}
