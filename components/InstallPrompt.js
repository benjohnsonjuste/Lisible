"use client";

import { useEffect, useState, useRef } from "react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  const autoCloseRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      clearTimeout(autoCloseRef.current);
      clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (!deferredPrompt) return;

    const showPrompt = () => {
      setShowBanner(true);
      autoCloseRef.current = setTimeout(() => {
        setShowBanner(false);
      }, 10000);
    };

    showPrompt();
    intervalRef.current = setInterval(showPrompt, 60000);

    return () => {
      clearTimeout(autoCloseRef.current);
      clearInterval(intervalRef.current);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    await deferredPrompt.userChoice;

    setDeferredPrompt(null);
    setShowBanner(false);
    clearTimeout(autoCloseRef.current);
    clearInterval(intervalRef.current);
  };

  const handleClose = () => {
    setShowBanner(false);
    clearTimeout(autoCloseRef.current);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-blue-600 text-white shadow-xl p-6 rounded-xl w-full max-w-md animate-fadeIn">
        <div className="flex items-center gap-3 mb-4">
          <img
            src="/favicon.ico"
            alt="Favicon"
            className="w-8 h-8"
          />
          <h2 className="text-lg font-bold">
            Installer Lisible
          </h2>
        </div>

        <p className="text-sm mb-6 opacity-90">
          Installez l’application pour un accès rapide et hors ligne.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition font-semibold"
          >
            Plus tard
          </button>

          <button
            onClick={handleInstallClick}
            className="px-4 py-2 rounded-lg bg-white text-blue-600 font-bold hover:bg-gray-100 transition"
          >
            Installer
          </button>
        </div>
      </div>
    </div>
  );
}