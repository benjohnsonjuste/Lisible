import { useEffect, useState, useRef } from "react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const autoCloseRef = useRef(null);
  const intervalRef = useRef(null);

  // Capture l'événement beforeinstallprompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      clearInterval(intervalRef.current);
      clearTimeout(autoCloseRef.current);
    };
  }, []);

  // Affiche la bannière toutes les 60 secondes si le prompt est disponible
  useEffect(() => {
    if (!deferredPrompt) return;

    const showBannerPeriodically = () => {
      setShowBanner(true);
      // Fermeture automatique après 10 secondes
      autoCloseRef.current = setTimeout(() => setShowBanner(false), 10000);
    };

    // Première apparition immédiate
    showBannerPeriodically();

    // Puis toutes les 60 secondes
    intervalRef.current = setInterval(showBannerPeriodically, 60000);

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(autoCloseRef.current);
    };
  }, [deferredPrompt]);

  // Lorsque l'utilisateur clique sur "Installer"
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    console.log(
      outcome === "accepted"
        ? "✅ L'utilisateur a installé l'application."
        : "❌ L'utilisateur a refusé l'installation."
    );

    setDeferredPrompt(null);
    setShowBanner(false);
    clearInterval(intervalRef.current);
    clearTimeout(autoCloseRef.current);
  };

  // Fermeture manuelle
  const handleClose = () => {
    setShowBanner(false);
    clearTimeout(autoCloseRef.current);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 
                    bg-blue-600 text-white shadow-lg p-4 z-50 flex justify-between items-center 
                    animate-slideDown rounded-lg max-w-lg w-full">
      <div className="font-semibold text-lg">📱 Installer Lisible</div>
      <div className="flex gap-2">
        <button
          onClick={handleInstallClick}
          className="bg-white text-blue-600 px-4 py-2 rounded-lg font-bold shadow hover:bg-gray-100 transition"
        >
          Installer
        </button>
        <button
          onClick={handleClose}
          className="bg-gray-200 text-blue-600 px-3 py-2 rounded-lg font-bold hover:bg-gray-300 transition"
        >
          ✖
        </button>
      </div>
    </div>
  );
}