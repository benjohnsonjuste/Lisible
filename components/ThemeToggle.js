"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Synchronisation au montage du composant
  useEffect(() => {
    setMounted(true);
    // Vérification initiale de la classe sur l'élément racine
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (root.classList.contains("dark")) {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  // Empêche le rendu côté serveur pour éviter les erreurs d'hydratation
  if (!mounted) return <div className="p-3 w-10 h-10" />;

  return (
    <button
      onClick={toggleTheme}
      aria-label="Changer de thème"
      className="group relative p-2.5 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 transition-all duration-300"
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        <Sun 
          size={20} 
          className={`absolute transform transition-all duration-500 text-amber-500 ${
            isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
          }`} 
        />
        <Moon 
          size={20} 
          className={`absolute transform transition-all duration-500 text-teal-400 ${
            isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
          }`} 
        />
      </div>
    </button>
  );
}
