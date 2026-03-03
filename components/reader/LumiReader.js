"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Sparkles, Moon, Sun, Wind, Flame, X } from "lucide-react";

const THEMES = {
  neutral: "from-slate-50 to-white text-slate-900",
  mystery: "from-slate-950 via-indigo-950 to-black text-slate-100",
  action: "from-orange-50 via-red-50 to-white text-slate-900",
  nature: "from-emerald-50 via-teal-50 to-white text-slate-900",
  dream: "from-purple-50 via-fuchsia-50 to-white text-slate-900"
};

export default function LumiReader({ title, content, author, onClose }) {
  const [currentTheme, setCurrentTheme] = useState("neutral");
  const [isLumiActive, setIsLumiActive] = useState(true);
  const containerRef = useRef(null);

  // Sécurisation du contenu : conversion du texte brut en tableau de paragraphes
  const paragraphs = useMemo(() => {
    if (!content) return [];
    return typeof content === "string" 
      ? content.split('\n').filter(p => p.trim() !== "") 
      : content;
  }, [content]);

  const keywords = {
    mystery: ["nuit", "ombre", "secret", "noir", "silence", "peur", "sombre", "mort", "fantôme"],
    action: ["sang", "feu", "épée", "courir", "cri", "guerre", "choc", "brûle", "vitesse"],
    nature: ["vent", "mer", "soleil", "fleur", "vert", "forêt", "eau", "ciel", "rivière"],
    dream: ["rêve", "étoile", "nuage", "magie", "amour", "douceur", "infini", "nuée"]
  };

  const analyzeContent = (text) => {
    if (!isLumiActive) return;
    const words = text.toLowerCase();
    for (const [theme, list] of Object.entries(keywords)) {
      if (list.some(word => words.includes(word))) {
        setCurrentTheme(theme);
        return;
      }
    }
    setCurrentTheme("neutral");
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const pElements = containerRef.current.querySelectorAll('p');
      let leadingPara = pElements[0];
      
      pElements.forEach(p => {
        const rect = p.getBoundingClientRect();
        if (rect.top > 0 && rect.top < window.innerHeight / 2) {
          leadingPara = p;
        }
      });

      if (leadingPara) analyzeContent(leadingPara.innerText);
    };

    window.addEventListener('scroll', handleScroll);
    // Bloquer le scroll du body quand le mode focus est actif
    document.body.style.overflow = 'hidden';
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.body.style.overflow = 'unset';
    };
  }, [isLumiActive]);

  return (
    <div className={`fixed inset-0 z-[200] overflow-y-auto transition-all duration-[1500ms] bg-gradient-to-b ${THEMES[currentTheme]}`}>
      
      {/* Contrôles */}
      <div className="fixed right-6 top-6 z-[210] flex items-center gap-3">
        <div className="flex items-center gap-3 p-2 px-4 rounded-2xl bg-black/5 backdrop-blur-md border border-black/5 text-[10px] font-black uppercase tracking-widest text-current opacity-50">
           {currentTheme === "mystery" && <Moon size={14} />}
           {currentTheme === "action" && <Flame size={14} />}
           {currentTheme === "nature" && <Wind size={14} />}
           {currentTheme === "dream" && <Sun size={14} />}
           <span>{currentTheme}</span>
        </div>

        <button 
          onClick={onClose}
          className="p-4 rounded-2xl bg-black/5 hover:bg-rose-500 hover:text-white transition-all border border-black/5"
        >
          <X size={20} />
        </button>
      </div>

      <article ref={containerRef} className="max-w-3xl mx-auto px-6 py-32 relative z-10">
        <header className="mb-24 space-y-6">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Lumière sur le texte</p>
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter leading-none">
            {title}
          </h1>
          <p className="text-xl font-bold italic opacity-60">par {author}</p>
        </header>

        <div className="space-y-12 font-serif">
          {paragraphs.map((para, i) => (
            <p key={i} className="text-2xl md:text-3xl leading-relaxed opacity-90 transition-opacity duration-700 hover:opacity-100">
              {para}
            </p>
          ))}
        </div>

        <footer className="mt-40 pb-20 text-center opacity-30 text-[10px] font-black uppercase tracking-[0.5em]">
          Fin du manuscrit
        </footer>
      </article>

      {/* Effet d'ambiance dynamique */}
      <div className={`fixed inset-0 pointer-events-none transition-opacity duration-[3000ms] z-0 opacity-20 ${currentTheme !== "neutral" ? 'opacity-20' : 'opacity-0'}`}>
        <div className="absolute top-0 left-0 w-full h-full bg-current mix-blend-overlay opacity-5" />
      </div>
    </div>
  );
}
