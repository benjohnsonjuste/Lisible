"use client";
import { useEffect } from "react";
import { toast } from "sonner";

export default function SecurityLock({ children, userEmail, activeAntiCapture = true }) {
  useEffect(() => {
    // 1. Bloquer le menu contextuel (Clic droit)
    const handleContextMenu = (e) => {
      e.preventDefault();
      toast.error("Contenu protégé : Impossible de copier du texte.");
    };

    // 2. Bloquer les raccourcis (Copier, Coller, Imprimer, Inspecter, Sauvegarder)
    const handleKeyDown = (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Bloquer PrintScreen
      if (e.key === "PrintScreen") {
        navigator.clipboard.writeText("");
        toast.error("Les captures d'écran sont interdites.");
      }

      // Liste des touches interdites
      const forbiddenKeys = ['c', 'v', 's', 'p', 'u', 'a'];
      if (modifier && forbiddenKeys.includes(e.key.toLowerCase())) {
        e.preventDefault();
        toast.error("Action non autorisée sur ce manuscrit.");
      }

      // Bloquer Inspecteur (F12, Ctrl+Shift+I)
      if (e.key === "F12" || (modifier && e.shiftKey && e.key.toLowerCase() === 'i')) {
        e.preventDefault();
        toast.error("L'accès aux sources est protégé.");
      }
    };

    // 3. Effet "Netflix" (Écran noir si on perd le focus ou fait une capture)
    const handleBlur = () => {
      if (activeAntiCapture) {
        document.body.style.filter = "brightness(0) blur(40px)";
        document.body.style.transition = "filter 0.3s ease";
      }
    };

    const handleFocus = () => {
      document.body.style.filter = "none";
    };

    // 4. Protection du presse-papier (Vider si copie forcée)
    const handleCopy = (e) => {
      e.preventDefault();
      e.clipboardData.setData('text/plain', "Contenu protégé par Lisible. Toute reproduction est interdite.");
    };

    // Ajout des écouteurs
    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("copy", handleCopy);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("copy", handleCopy);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, [activeAntiCapture]);

  return (
    <div className="relative overflow-hidden select-none no-screenshot">
      {/* Watermark Dynamique (Filigrane) */}
      {userEmail && (
        <div className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.03] flex flex-wrap gap-24 overflow-hidden rotate-[-25deg] scale-150">
          {Array(80).fill(userEmail).map((email, i) => (
            <span key={i} className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest whitespace-nowrap">
              {email} - LISIBLE
            </span>
          ))}
        </div>
      )}

      {/* Le contenu protégé */}
      <div className="relative z-10">
        {children}
      </div>

      <style jsx global>{`
        .no-screenshot {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
          -webkit-user-drag: none;
        }
        @media print {
          body { display: none !important; }
        }
      `}</style>
    </div>
  );
}
