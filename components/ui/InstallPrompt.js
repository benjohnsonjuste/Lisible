// components/ui/InstallPrompt.jsx
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InstallPrompt({ variant = "modal" }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    setIsInstalling(true);

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    console.log("Résultat installation :", outcome);
    setDeferredPrompt(null);
    setShowPrompt(false);
    setIsInstalling(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  // ========================
  // VARIANTE MODALE (popup)
  // ========================
  if (variant === "modal") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Installer Lisible
            </h2>
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className="p-2 -mr-2"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <p className="text-gray-600 mb-6">
            Ajoutez Lisible à votre écran d’accueil pour une expérience optimale.
          </p>

          <div className="flex gap-3">
            <Button
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="flex-1"
            >
              {isInstalling ? "Installation…" : "Installer"}
            </Button>

            <Button onClick={handleDismiss} variant="outline">
              Plus tard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ========================
  // VARIANTE BANNIÈRE (haut)
  // ========================
  if (variant === "banner") {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white p-4 flex justify-between items-center shadow-lg">
        <p className="text-sm font-medium">
          Installez Lisible pour un accès rapide et hors ligne.
        </p>
        <div className="flex gap-2">
          <Button
            onClick={handleInstallClick}
            size="sm"
            className="bg-white text-blue-600 hover:bg-gray-100"
          >
            {isInstalling ? "..." : "Installer"}
          </Button>
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-blue-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ========================
  // VARIANTE BOUTON FLOTTANT
  // ========================
  if (variant === "button") {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleInstallClick}
          disabled={isInstalling}
          className="shadow-lg rounded-full px-6 py-3"
        >
          {isInstalling ? "Installation…" : "Installer l’app"}
        </Button>
      </div>
    );
  }

  return null;
      }
