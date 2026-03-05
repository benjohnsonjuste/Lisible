"use client";
import { useEffect } from "react";
import { toast } from "sonner";

export default function SecurityLock({ children }) {
  useEffect(() => {
    // 1. Bloquer le menu contextuel (Clic droit)
    const handleContextMenu = (e) => {
      e.preventDefault();
      toast.error("Le clic droit est désactivé sur ce contenu.");
    };

    // 2. Bloquer les raccourcis clavier (Copier, Imprimer, Inspecter)
    const handleKeyDown = (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Liste des touches interdites : c (copie), p (impression), u (source), s (sauvegarde)
      const forbiddenKeys = ['c', 'p', 'u', 's'];
      
      if (modifier && forbiddenKeys.includes(e.key.toLowerCase())) {
        e.preventDefault();
        toast.error("Action de copie ou d'exportation interdite.");
      }

      // Bloquer l'inspecteur d'éléments (F12 ou Ctrl+Shift+I)
      if (e.key === "F12" || (modifier && e.shiftKey && e.key.toLowerCase() === 'i')) {
        e.preventDefault();
        toast.error("L'accès aux outils de développement est restreint.");
      }
    };

    // 3. Intercepter l'événement de copie natif
    const handleCopy = (e) => {
      e.preventDefault();
      toast.error("La copie du texte est désactivée.");
    };

    // Ajout des écouteurs d'événements
    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("copy", handleCopy);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("copy", handleCopy);
    };
  }, []);

  return (
    <div className="relative select-none no-copy">
      {/* Contenu protégé */}
      <div className="relative z-10">
        {children}
      </div>

      <style jsx global>{`
        /* Empêcher la sélection de texte au niveau CSS */
        .no-copy {
          -webkit-touch-callout: none; /* iOS Safari */
          -webkit-user-select: none;    /* Safari */
          -khtml-user-select: none;     /* Konqueror HTML */
          -moz-user-select: none;        /* Firefox */
          -ms-user-select: none;         /* Internet Explorer/Edge */
          user-select: none;             /* Chrome, Edge, Opera and Firefox */
        }

        /* Masquer le contenu lors d'une tentative d'impression */
        @media print {
          body { display: none !important; }
        }
      `}</style>
    </div>
  );
}
