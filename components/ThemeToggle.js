"use client";
import { useEffect, useState } from "react";
import { Moon, Sun, Sparkles } from "lucide-react";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // 1. Initialisation au montage
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = savedTheme === "dark" || (!savedTheme && systemPrefersDark);
    
    setIsDark(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDark;
    setIsDark(newMode);
    
    // Application immédiate de la classe
    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }

    // 2. Audio - Isolé dans un bloc try/catch pour ne pas casser le toggle
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
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
    } catch (e) {
      // On ignore silencieusement les erreurs audio (ex: autoplay policy)
      console.log("Audio feedback non supporté ou bloqué");
    }
  };

  if (!mounted) return <div className="p-3 w-11 h-11" />;

  return (
    <button
      onClick={toggleTheme}
      type="button" // Toujours préciser le type pour éviter des comportements de formulaire
      aria-label="Changer de thème"
      className="group relative p-3 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-slate-100 dark:border-white/10 shadow-sm transition-all duration-500 overflow-hidden active:scale-95"
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/0 via-teal-500/0 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative w-5 h-5 flex items-center justify-center">
        <Sun 
          size={20} 
          className={`absolute transform transition-all duration-700 ease-in-out text-amber-500 ${
            isDark ? "rotate-[120deg] scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
          }`} 
        />
        
        <div className={`absolute transform transition-all duration-700 ease-in-out ${
            isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-[120deg] scale-0 opacity-0"
          }`}>
          <Moon size={20} className="text-teal-400 fill-teal-400/10" />
          <Sparkles size={8} className="absolute -top-1 -right-1 text-teal-200 animate-pulse" />
        </div>
      </div>
    </button>
  );
}
