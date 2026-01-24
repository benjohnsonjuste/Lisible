"use client";
import { useEffect, useState, useRef } from "react";
import { Download, X, Smartphone } from "lucide-react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  const autoCloseRef = useRef(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // On vérifie si l'utilisateur a déjà décliné l'installation durant cette session
      const isDismissed = sessionStorage.getItem("lisible_install_dismissed");
      if (!isDismissed) {
        // On affiche la bannière après 5 secondes pour ne pas agresser l'utilisateur
        setTimeout(() => setShowBanner(true), 5000);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      if (autoCloseRef.current) clearTimeout(autoCloseRef.current);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("L'utilisateur a installé l'app");
    }

    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleClose = () => {
    setShowBanner(false);
    // On mémorise le refus pour la session actuelle afin de ne pas le réafficher
    sessionStorage.setItem("lisible_install_dismissed", "true");
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-[400px] z-[110] animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] shadow-2xl border border-white/10 relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl" />

        <div className="flex items-start gap-4 relative z-10">
          <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-teal-500/20">
            <Smartphone className="text-slate-950" size={24} />
          </div>
          
          <div className="space-y-1">
            <h3 className="font-black italic text-lg tracking-tight">Lisible App</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Ajoutez Lisible à votre écran d'accueil pour une expérience de lecture fluide et rapide.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6 relative z-10">
          <button
            onClick={handleInstallClick}
            className="flex-grow bg-teal-500 hover:bg-teal-400 text-slate-950 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Download size={14} /> Installer
          </button>
          
          <button
            onClick={handleClose}
            className="px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl transition-all"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
