"use client";
import React, { useState, useEffect } from "react";
import { Sparkles, Zap, ShieldCheck } from "lucide-react";

export default function TransitionVers3D({ onComplete }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500); // Laisse respirer à 100%
          return 100;
        }
        return prev + 2;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center">
      {/* Effet de scan holographique */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="w-full h-[2px] bg-teal-500 shadow-[0_0_20px_#2dd4bf] animate-scan" />
      </div>

      <div className="relative mb-12">
        <div className="w-24 h-24 rounded-full border-2 border-teal-900 flex items-center justify-center animate-pulse">
          <Zap className="text-teal-400 fill-teal-400/20" size={40} />
        </div>
        {/* Anneaux rotatifs */}
        <div className="absolute inset-[-10px] border-t-2 border-teal-500 rounded-full animate-spin" />
        <div className="absolute inset-[-20px] border-b-2 border-teal-900 rounded-full animate-spin-slow" />
      </div>

      <div className="text-center space-y-4">
        <h2 className="text-teal-500 font-black italic text-2xl tracking-[0.2em]">
          DÉMATÉRIALISATION
        </h2>
        <div className="w-64 h-1 bg-teal-950 rounded-full overflow-hidden">
          <div 
            className="h-full bg-teal-400 transition-all duration-300" 
            style={{ width: `${progress}%` }} 
          />
        </div>
        <div className="flex items-center justify-center gap-2 text-teal-900 font-mono text-[9px] uppercase tracking-widest">
           <ShieldCheck size={12} /> Flux sécurisé : {progress}%
        </div>
      </div>
    </div>
  );
}
