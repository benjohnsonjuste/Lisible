"use client";
import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Moon, Sun, Wind, Flame } from "lucide-react";

const THEMES = {
  neutral: "from-slate-50 to-white text-slate-900 shadow-slate-200",
  mystery: "from-slate-950 via-indigo-950 to-black text-slate-100 shadow-indigo-500/20",
  action: "from-orange-50 via-red-50 to-white text-slate-900 shadow-red-200",
  nature: "from-emerald-50 via-teal-50 to-white text-slate-900 shadow-teal-200",
  dream: "from-purple-50 via-fuchsia-50 to-white text-slate-900 shadow-fuchsia-200"
};

export default function LumiReader({ title, content }) {
  const [currentTheme, setCurrentTheme] = useState("neutral");
  const [isLumiActive, setIsLumiActive] = useState(true);
  const containerRef = useRef(null);

  // Mots-clés pour l'analyse de sentiment simplifiée
  const keywords = {
    mystery: ["nuit", "ombre", "secret", "noir", "silence", "peur", "sombre", "mort"],
    action: ["sang", "feu", "épée", "courir", "cri", "guerre", "choc", "brûle"],
    nature: ["vent", "mer", "soleil", "fleur", "vert", "forêt", "eau", "ciel"],
    dream: ["rêve", "étoile", "nuage", "magie", "amour", "douceur", "infini"]
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

  // Détecter le paragraphe au centre de l'écran lors du scroll
  useEffect(() => {
    const handleScroll = () => {
      const paragraphs = containerRef.current.querySelectorAll('p');
      let leadingPara = paragraphs[0];
      
      paragraphs.forEach(p => {
        const rect = p.getBoundingClientRect();
        if (rect.top > 0 && rect.top < window.innerHeight / 2) {
          leadingPara = p;
        }
      });

      if (leadingPara) analyzeContent(leadingPara.innerText);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLumiActive]);

  return (
    <div className={`min-h-screen transition-all duration-[2000ms] ease-in-out bg-gradient-to-b ${THEMES[currentTheme]}`}>
      
      {/* Barre d'outils flottante High-Tech */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4">
        <button 
          onClick={() => setIsLumiActive(!isLumiActive)}
          className={`p-4 rounded-2xl backdrop-blur-md border transition-all ${isLumiActive ? 'bg-teal-500 border-teal-400 text-white shadow-lg shadow-teal-500/40' : 'bg-white/10 border-white/20 text-slate-400'}`}
          title="Activer Lumi-Lecture"
        >
          <Sparkles size={20} className={isLumiActive ? "animate-pulse" : ""} />
        </button>
        
        <div className="flex flex-col gap-2 p-2 rounded-2xl bg-black/5 backdrop-blur-md border border-black/5 italic text-[10px] font-black items-center text-slate-400">
           {currentTheme === "mystery" && <Moon size={14} className="text-indigo-400" />}
           {currentTheme === "action" && <Flame size={14} className="text-red-400" />}
           {currentTheme === "nature" && <Wind size={14} className="text-teal-400" />}
           {currentTheme === "dream" && <Sun size={14} className="text-fuchsia-400" />}
           <span className="uppercase tracking-widest mt-1">{currentTheme}</span>
        </div>
      </div>

      {/* Zone de lecture */}
      <article ref={containerRef} className="max-w-3xl mx-auto px-6 py-32 space-y-12">
        <header className="space-y-4 mb-20 text-center">
          <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter leading-none uppercase">
            {title}
          </h1>
          <div className="h-1 w-24 bg-current mx-auto opacity-20 rounded-full" />
        </header>

        <div className="prose prose-xl prose-slate transition-colors duration-1000">
          {content.map((para, i) => (
            <p key={i} className="text-2xl font-medium leading-relaxed mb-10 opacity-90 transition-all hover:opacity-100">
              {para}
            </p>
          ))}
        </div>
      </article>

      {/* Effet de halo ambiant */}
      <div className={`fixed inset-0 pointer-events-none transition-opacity duration-[3000ms] z-0 opacity-30 ${currentTheme !== "neutral" ? 'block' : 'hidden'}`}>
        <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] bg-current`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] bg-current`} />
      </div>
    </div>
  );
}
