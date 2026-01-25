"use client";
import React, { useState, useEffect } from "react";
import { Download, X, Sparkles } from "lucide-react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Empêcher Chrome d'afficher la mini-barre automatique
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Ne l'afficher que si l'utilisateur ne l'a pas déjà fermé pour cette session
      const isDismissed = sessionStorage.getItem("pwa_prompt_dismissed");
      if (!isDismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setIsVisible(false);
    }
    
    setDeferredPrompt(null);
  };

  const dismissPrompt = () => {
    setIsVisible(false);
    // On mémorise le refus pour la session actuelle
    sessionStorage.setItem("pwa_prompt_dismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-20 left-4 right-4 z-[110] animate-in slide-in-from-top-10 duration-500">
      <div className="max-w-xl mx-auto bg-slate-900/95 backdrop-blur-xl border border-white/10 p-3 rounded-[2rem] shadow-2xl shadow-teal-900/20 flex items-center justify-between gap-3">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-teal-500/30">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="text-white text-[10px] font-black uppercase tracking-widest">Application Lisible</p>
            <p className="text-slate-400 text-[9px] italic font-medium">Installez pour un accès rapide</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleInstallClick}
            className="bg-white text-slate-950 px-4 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-tighter active:scale-95 transition-transform"
          >
            Installer
          </button>
          
          <button 
            onClick={dismissPrompt}
            className="p-2 text-slate-500 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
