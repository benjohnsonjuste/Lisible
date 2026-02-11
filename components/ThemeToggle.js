"use client";
import { useEffect, useState } from "react";
import { Moon, Sun, Sparkles } from "lucide-react";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // 1. Initialisation et détection du système
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const newMode = !isDark;
    
    setIsDark(newMode);
    
    if (newMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }

    // Petit retour haptique visuel via le son (Optionnel/Subtil)
    if (typeof window !== "undefined") {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(newMode ? 440 : 880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    }
  };

  if (!mounted) return <div className="p-3 w-11 h-11" />;

  return (
    <button
      onClick={toggleTheme}
      aria-label="Changer de thème"
      className="group relative p-3 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-slate-100 dark:border-white/10 shadow-sm transition-all duration-500 overflow-hidden active:scale-90"
    >
      {/* Effet de brillance au survol */}
      <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/0 via-teal-500/0 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative w-5 h-5 flex items-center justify-center">
        {/* Soleil avec rayons animés */}
        <Sun 
          size={20} 
          className={`absolute transform transition-all duration-700 ease-in-out text-amber-500 ${
            isDark ? "rotate-[120deg] scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
          }`} 
        />
        
        {/* Lune avec étoiles scintillantes */}
        <div className={`absolute transform transition-all duration-700 ease-in-out ${
            isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-[120deg] scale-0 opacity-0"
          }`}>
          <Moon size={20} className="text-teal-400 fill-teal-400/10" />
          <Sparkles size={8} className="absolute -top-1 -right-1 text-teal-200 animate-pulse" />
        </div>
      </div>

      {/* Indicateur de focus discret */}
      <span className="sr-only">Passer en mode {isDark ? "clair" : "sombre"}</span>
    </button>
  );
}
