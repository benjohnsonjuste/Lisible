"use client";
import React, { useState, useEffect } from "react";
import { X, ExternalLink, Megaphone } from "lucide-react";

export function PartnerBanner() {
  const [currentAd, setCurrentAd] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 1. Récupération de la configuration dynamique depuis le Dashboard
    const fetchAds = async () => {
      try {
        const res = await fetch('/api/admin/update-partners');
        const data = await res.json();
        
        // On vérifie s'il y a des publicités actives
        if (data && data.ads && data.ads.length > 0) {
          const ads = data.ads;
          const randomAd = ads[Math.floor(Math.random() * ads.length)];
          setCurrentAd(randomAd);
          
          // 2. Déclenchement de l'affichage avec un léger délai
          setTimeout(() => {
            setIsVisible(true);
            
            // 3. TRACKING : Enregistrement automatique de la VUE (Impression)
            fetch('/api/partner-tracker', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ partnerId: randomAd.id, action: 'view' })
            }).catch(err => console.error("Impression tracking error:", err));
            
          }, 2000);
        }
      } catch (err) {
        console.error("Erreur de récupération des partenaires:", err);
      }
    };

    fetchAds();
  }, []);

  // TRACKING : Enregistrement du CLIC
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
    <div className="fixed top-0 left-0 right-0 z-[100] animate-in slide-in-from-top duration-700">
      <div className={`${currentAd.color} text-white px-4 py-3 shadow-2xl transition-colors duration-500`}>
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
              onClick={handlePartnerClick}
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
