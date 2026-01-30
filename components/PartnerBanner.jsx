"use client";
import React, { useState, useEffect } from "react";
import { X, ExternalLink, Megaphone } from "lucide-react";

export function PartnerBanner() {
  const [currentAd, setCurrentAd] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  // Vos données partenaires
  const partners = [
    {
      id: "editions_futur_01", // Utilisez des ID uniques pour le tracking
      client: "Éditions du Futur",
      message: "Découvrez notre nouveau concours de nouvelles SF 🚀",
      link: "https://partenaire.com/concours",
      color: "bg-indigo-600",
      cta: "Participer"
    },
    {
      id: "plume_co_02",
      client: "Plume & Co",
      message: "-20% sur les ateliers d'écriture créative",
      link: "https://partenaire.com/ateliers",
      color: "bg-teal-600",
      cta: "En savoir plus"
    }
  ];

  // Sélection de la publicité et Tracking de la VUE
  useEffect(() => {
    const randomAd = partners[Math.floor(Math.random() * partners.length)];
    setCurrentAd(randomAd);
    
    const timer = setTimeout(() => {
      setIsVisible(true);
      
      // Enregistrement automatique de l'impression (vue)
      fetch('/api/partner-tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId: randomAd.id, action: 'view' })
      }).catch(err => console.error("Tracking error:", err));
      
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Tracking du CLIC
  const handlePartnerClick = async () => {
    if (!currentAd) return;
    try {
      await fetch('/api/partner-tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId: currentAd.id, action: 'click' })
      });
    } catch (err) {
      console.error("Click tracking error:", err);
    }
  };

  if (!currentAd || !isVisible) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-[100] animate-in slide-in-from-top duration-700`}>
      <div className={`${currentAd.color} text-white px-4 py-3 shadow-2xl`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="bg-white/20 p-2 rounded-xl hidden md:block">
              <Megaphone size={16} className="animate-bounce" />
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
              <span className="text-[8px] font-black uppercase tracking-[0.3em] bg-black/20 px-2 py-0.5 rounded-full w-fit">
                Partenaire
              </span>
              <p className="text-[11px] md:text-xs font-bold tracking-wide truncate">
                {currentAd.message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-4">
            <a 
              href={currentAd.link} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={handlePartnerClick} // <--- Déclenche le tracking du clic
              className="bg-white text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-100 transition-all shadow-lg active:scale-95"
            >
              {currentAd.cta} <ExternalLink size={12} />
            </a>
            <button 
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-black/10 rounded-full transition-colors"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          </div>
          
        </div>
      </div>
      <div className="h-[1px] bg-black/10 w-full" />
    </div>
  );
}
