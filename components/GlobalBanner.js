"use client";
import React, { useEffect, useState } from "react";
import { Megaphone, X, ArrowRight, Sparkles } from "lucide-react";

export default function GlobalBanner() {
  const [announcement, setAnnouncement] = useState(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        const res = await fetch(`https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/settings/announcements.json?t=${Date.now()}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.length > 0) setAnnouncement(data[0]);
      } catch (err) {
        console.error("Erreur annonces:", err);
      }
    }
    fetchAnnouncements();
  }, []);

  if (!announcement || !visible) return null;

  // Extraction du lien : on cherche une URL dans le message
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const match = announcement.message.match(urlRegex);
  const link = match ? match[0] : null;
  // On nettoie le message pour enlever l'URL brute du texte affiché
  const cleanMessage = announcement.message.replace(urlRegex, "").trim();

  return (
    <div className="relative bg-slate-950 text-white py-3 px-6 overflow-hidden border-b border-white/5">
      {/* Effet de brillance animé en arrière-plan */}
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(20,184,166,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_5s_infinite_linear]" />
      
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-amber-400 text-slate-950 text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full animate-bounce">
            <Sparkles size={10} /> Nouveau
          </div>
          <p className="text-[12px] md:text-sm font-medium tracking-wide text-slate-200">
            {cleanMessage}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {link && (
            <a 
              href={link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-center gap-2 bg-white text-slate-950 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-teal-500 hover:text-white transition-all duration-300 shadow-xl"
            >
              Découvrir 
              <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </a>
          )}

          <button 
            onClick={() => setVisible(false)}
            className="p-1 hover:bg-white/10 rounded-full transition-colors text-slate-500 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
