"use client";

import { useEffect, useState, useRef } from "react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [translateX, setTranslateX] = useState(0);
  const timerRef = useRef(null);
  const startX = useRef(0);
  const [platform, setPlatform] = useState("other"); // android, ios, windows, linux, other

  useEffect(() => {
    // Détection de la plateforme
    const userAgent = navigator.userAgent.toLowerCase();
    if (/android/.test(userAgent)) setPlatform("android");
    else if (/iphone|ipad|ipod/.test(userAgent)) setPlatform("ios");
    else if (/windows/.test(userAgent)) setPlatform("windows");
    else if (/linux/.test(userAgent)) setPlatform("linux");
    else setPlatform("other");

    // Android : beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Affichage périodique toutes les 30 secondes pendant 15 secondes
    const interval = setInterval(() => {
      setShowBanner(true);
      timerRef.current = setTimeout(() => setShowBanner(false), 15000);
    }, 30000);

    // Première apparition au bout d’une seconde
    const firstTimer = setTimeout(() => {
      setShowBanner(true);
      timerRef.current = setTimeout(() => setShowBanner(false), 15000);
    }, 1000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      clearInterval(interval);
      clearTimeout(firstTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleInstallClick = async () => {
    if (platform === "android" && deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(
        outcome === "accepted"
          ? "✅ L'utilisateur a installé l'application."
          : "❌ L'utilisateur a refusé l'installation."
      );
    } else {
      alert(
        platform === "ios"
          ? "Pour installer Lisible sur iOS, appuyez sur l’icône Partager et choisissez 'Ajouter à l’écran d’accueil'."
          : "Pour installer Lisible sur votre ordinateur, ajoutez cette page à vos favoris ou créez un raccourci depuis votre navigateur."
      );
    }
    setShowBanner(false);
  };

  // Gestion du swipe pour fermer
  const handleTouchStart = (e) => {
    startX.current = e.touches ? e.touches[0].clientX : e.clientX;
  };

  const handleTouchMove = (e) => {
    const currentX = e.touches ? e.touches[0].clientX : e.clientX;
    const deltaX = currentX - startX.current;
    setTranslateX(deltaX);
  };

  const handleTouchEnd = () => {
    if (Math.abs(translateX) > 100) setShowBanner(false);
    else setTranslateX(0);
  };

  if (!showBanner) return null;

  const bannerText = {
    android: "Installer Lisible pour un accès rapide.",
    ios: "Ajouter Lisible à votre écran d’accueil pour un accès rapide.",
    windows: "Créez un raccourci pour installer Lisible sur votre ordinateur.",
    linux: "Créez un raccourci pour installer Lisible sur votre ordinateur.",
    other: "Installez Lisible pour un accès rapide.",
  };

  return (
    <div
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="fixed top-4 left-1/2 z-50 w-[90%] max-w-lg transform -translate-x-1/2 transition-transform duration-300"
      style={{ transform: `translateX(${translateX}px) translateX(-50%)` }}
    >
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl shadow-2xl p-4 flex items-center justify-between border border-blue-400 animate-fadeInDown">
        {/* Icône et texte */}
        <div className="flex items-center gap-3">
          <div className="bg-black rounded-full p-2 shadow-lg">
            <img src="/favicon.ico" alt="Lisible logo" className="w-8 h-8" />
          </div>
          <div>
            <p className="font-bold text-lg">Lisible</p>
            <p className="text-sm opacity-90">{bannerText[platform]}</p>
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