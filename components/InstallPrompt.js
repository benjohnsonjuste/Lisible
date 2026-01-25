"use client";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Empêcher Chrome d'afficher la mini-barre automatique
      e.preventDefault();
      // Stocker l'événement pour plus tard
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Afficher le prompt natif
    deferredPrompt.prompt();

    // Attendre la réponse de l'utilisateur
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      console.log("L'utilisateur a installé l'app");
    }
    
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 z-[100] animate-in slide-in-from-bottom-10">
      <div className="bg-slate-900 border border-white/10 p-4 rounded-3xl shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center text-white">
            <Download size={20} />
          </div>
          <div>
            <p className="text-white text-[10px] font-black uppercase tracking-widest">Installer Lisible</p>
            <p className="text-slate-400 text-[9px]">Accédez à Lisible en un clic</p>
          </div>
        </div>
        <button 
          onClick={handleInstallClick}
          className="bg-white text-slate-950 px-5 py-2 rounded-xl font-black text-[9px] uppercase tracking-tighter"
        >
          Installer
        </button>
      </div>
    </div>
  );
}
