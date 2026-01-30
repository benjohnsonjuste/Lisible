"use client";
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
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
    if (outcome === "accepted") setIsVisible(false);
    setDeferredPrompt(null);
  };

  const dismissPrompt = () => {
    setIsVisible(false);
    sessionStorage.setItem("pwa_prompt_dismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-20 left-4 right-4 z-[110] animate-in slide-in-from-top-10 duration-700">
      <div className="max-w-xl mx-auto bg-slate-900/90 backdrop-blur-2xl border border-white/10 p-2.5 pl-4 rounded-[2.5rem] shadow-2xl shadow-black/50 flex items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          {/* LOGO OFFICIEL AU LIEU DE L'ICÔNE SPARKLES */}
          <div className="relative shrink-0">
            <img 
              src="/icon-192.png" 
              alt="Lisible PWA" 
              className="w-12 h-12 rounded-2xl object-cover shadow-lg border border-white/10"
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-teal-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            </div>
          </div>

          <div>
            <h4 className="text-white text-[11px] font-black uppercase tracking-widest leading-none">
              Lisible App
            </h4>
            <p className="text-slate-400 text-[9px] mt-1 font-medium italic">
              L'expérience de streaming complète
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleInstallClick}
            className="bg-teal-500 hover:bg-teal-400 text-white px-5 py-3 rounded-[1.2rem] font-black text-[10px] uppercase tracking-tighter shadow-xl shadow-teal-500/20 active:scale-95 transition-all"
          >
            Installer
          </button>
          
          <button 
            onClick={dismissPrompt}
            className="p-3 text-slate-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
