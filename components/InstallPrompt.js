import { useEffect, useState, useRef } from "react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const timerRef = useRef(null);

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

  const handleClose = () => {
    setShowBanner(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed top-0 left-0 w-full bg-blue-600 text-white shadow-lg p-4 z-50 flex justify-between items-center animate-slideDown">
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