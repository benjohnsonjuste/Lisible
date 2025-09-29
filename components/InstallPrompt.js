import { useEffect, useState, useRef } from "react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [translateX, setTranslateX] = useState(0);
  const timerRef = useRef(null);
  const startX = useRef(0);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);

      timerRef.current = setTimeout(() => setShowBanner(false), 10000);
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

    console.log(
      outcome === "accepted"
        ? "✅ L'utilisateur a installé l'application."
        : "❌ L'utilisateur a refusé l'installation."
    );

    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleTouchStart = (e) => {
    startX.current = e.touches ? e.touches[0].clientX : e.clientX;
  };

  const handleTouchMove = (e) => {
    const currentX = e.touches ? e.touches[0].clientX : e.clientX;
    const deltaX = currentX - startX.current;
    setTranslateX(deltaX);
  };

  const handleTouchEnd = () => {
    if (Math.abs(translateX) > 100) {
      setShowBanner(false);
    } else {
      setTranslateX(0);
    }
  };

  if (!showBanner) return null;

  return (
    <div
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="fixed top-4 left-1/2 z-50"
      style={{ transform: `translateX(-50%) translateX(${translateX}px)` }}
    >
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl shadow-2xl p-4 flex items-center justify-between max-w-md w-[95%] animate-slideDown border border-blue-400">
        {/* Icône et texte */}
        <div className="flex items-center gap-3">
          <div className="bg-black rounded-full p-2 shadow-lg">
            <img src="/favicon.ico" alt="Lisible logo" className="w-8 h-8" />
          </div>
          <div>
            <p className="font-bold text-lg">Installer Lisible</p>
            <p className="text-sm opacity-90">
              Installer Lisible pour un accès rapide.
            </p>
          </div>
        </div>

        {/* Bouton installer */}
        <button
          onClick={handleInstallClick}
          className="bg-white text-blue-700 px-4 py-2 rounded-xl font-semibold text-sm hover:bg-gray-100 transition-all duration-300 shadow"
        >
          Installer
        </button>
      </div>
    </div>
  );
}