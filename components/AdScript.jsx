"use client";
import { useEffect } from "react";

export default function AdScript() {
  useEffect(() => {
    // Identifiant unique pour éviter de charger le script plusieurs fois
    const scriptId = "native-ad-script";
    
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://pl28554024.effectivegatecpm.com/874a186feecd3e968c16a58bb085fd56/invoke.js";
      script.async = true;
      script.setAttribute("data-cfasync", "false");
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div className="my-8 w-full overflow-hidden rounded-[2rem] bg-white p-4 border border-slate-100 shadow-sm">
      <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-3 ml-4">
        Suggestion culturelle
      </p>
      {/* Le conteneur injecté par la régie */}
      <div id="container-874a186feecd3e968c16a58bb085fd56"></div>
    </div>
  );
}
