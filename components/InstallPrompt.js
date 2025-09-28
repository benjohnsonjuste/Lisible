import { useEffect, useState, useRef } from "react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const timerRef = useRef(null);

  // Fonction pour jouer un bip sonore
  const playBeep = () => {
    const audio = new Audio(
      "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAAAAA="
    );
    audio.play().catch(() => {
      console.warn("Le son n'a pas pu être joué automatiquement.");
    });
  };

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
      playBeep();

      // Auto-fermeture après 10 secondes
      timerRef.current = setTimeout(() => {
        setShowBanner(false);
      }, 10000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("✅ L'utilisateur a installé l'application.");
    } else {
      console.log("❌ L'utilisateur a refusé l'installation.");
    }

    setDeferredPrompt(null);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed top-0 left-0 w-full bg-blue-600 text-white shadow-lg p-4 z-50 animate-slideDown flex justify-between items-center">
      <div className="font-semibold text-lg">📱 Installer Lisible</div>
      <button
        onClick={handleInstallClick}
        className="bg-white text-blue-600 px-4 py-2 rounded-lg font-bold shadow hover:bg-gray-100 transition"
      >
        Installer
      </button>
    </div>
  );
}