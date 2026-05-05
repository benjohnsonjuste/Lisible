"use client";

import React, { useEffect, useRef, useState } from "react";

const InTextAd = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const containerId = "container-874a186feecd3e968c16a58bb085fd56";

  useEffect(() => {
    const container = document.getElementById(containerId);

    if (container && container.children.length === 0) {
      const script = document.createElement("script");
      script.async = true;
      script.dataset.cfasync = "false";
      script.src = `https://pl28554024.profitablecpmratenetwork.com/874a186feecd3e968c16a58bb085fd56/invoke.js`;
      
      container.appendChild(script);
      
      // Petit délai pour laisser le temps au script de générer l'iframe
      const timer = setTimeout(() => setIsLoaded(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <section 
      className={`w-full my-12 py-6 flex flex-col items-center transition-all duration-700 ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {/* Indicateur discret pour le lecteur */}
      <div className="w-full flex items-center gap-4 mb-6">
        <div className="h-[1px] flex-1 bg-slate-200/50"></div>
        <span className="text-[10px] font-sans font-bold tracking-[0.2em] text-slate-400 uppercase">
          Continuer la lecture
        </span>
        <div className="h-[1px] flex-1 bg-slate-200/50"></div>
      </div>

      <div 
        className="w-full max-w-full overflow-hidden flex justify-center"
        style={{ minHeight: "160px" }} // Espace réservé pour éviter le décalage (Layout Shift)
      >
        <div id={containerId} className="w-full"></div>
      </div>

      <div className="w-full h-[1px] bg-slate-200/50 mt-10"></div>
    </section>
  );
};

export default InTextAd;
