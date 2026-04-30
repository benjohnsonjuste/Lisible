"use client";

import React, { useState, useEffect, useId } from "react";
import { X, Sparkles } from "lucide-react";

// Utilisation de l'export nommé pour correspondre à l'import dans TextContent
export function InTextAd() {
  const [isVisible, setIsVisible] = useState(true);
  const instanceId = useId().replace(/:/g, "");
  const containerId = `container-${instanceId}`;

  useEffect(() => {
    if (!isVisible) return;

    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";

    const widthScreen = window.innerWidth;
    let adConfig;

    if (widthScreen < 640) {
      adConfig = { width: 300, height: 250 };
    } else if (widthScreen < 1024) {
      adConfig = { width: 300, height: 600 };
    } else {
      adConfig = { width: 728, height: 90 };
    }

    const loadAd = (config) => {
      container.innerHTML = "";
      window.atOptions = {
        key: "874a186feecd3e968c16a58bb085fd56",
        format: "iframe",
        height: config.height,
        width: config.width,
        params: {},
      };

      const script = document.createElement("script");
      script.type = "text/javascript";
      script.src = `//pl28554024.effectivegatecpm.com/874a186feecd3e968c16a58bb085fd56/invoke.js`;
      
      container.appendChild(script);
    };

    loadAd(adConfig);

    const extraScript = document.createElement("script");
    extraScript.src = "https://pl28594689.effectivegatecpm.com/62/bc/8f/62bc8f4d06d16b0f6d6297a4e94cfdfd.js";
    extraScript.async = true;
    document.body.appendChild(extraScript);

    return () => {
      if (container) container.innerHTML = "";
    };
  }, [isVisible, containerId]);

  if (!isVisible) return null;

  return (
    <div className="my-12 flex justify-center w-full animate-in fade-in duration-700">
      <div className="relative bg-slate-900 border border-slate-800 p-4 rounded-[2rem] shadow-2xl w-full max-w-3xl">
        <div className="flex items-center justify-between px-4 mb-3">
          <div className="flex items-center gap-1.5">
            <Sparkles size={10} className="text-blue-500" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
              Contenu Sponsorisé
            </span>
          </div>
          <button onClick={() => setIsVisible(false)} className="text-slate-600 hover:text-rose-400 transition-colors p-1">
            <X size={16} />
          </button>
        </div>
        <div className="bg-black/20 rounded-2xl overflow-hidden flex items-center justify-center border border-white/5 w-full min-h-[120px] md:min-h-[280px]">
          <div id={containerId} className="flex justify-center items-center w-full min-h-[90px]" />
        </div>
        <div className="mt-3 flex justify-center items-center gap-2">
          <div className="h-[1px] w-8 bg-slate-800" />
          <p className="text-[8px] font-bold text-slate-600 uppercase tracking-[0.2em] opacity-80">Soutien aux auteurs</p>
          <div className="h-[1px] w-8 bg-slate-800" />
        </div>
      </div>
    </div>
  );
}
