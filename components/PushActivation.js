"use client";
import React, { useState, useEffect } from "react";
import { Bell, X, CheckCircle } from "lucide-react";

export default function PushActivation() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Vérifie si l'utilisateur a déjà répondu ou si les notifications sont bloquées
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        const timer = setTimeout(() => setShowPrompt(true), 5000); // Apparaît après 5s
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const requestPermission = async () => {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      // Ici, vous enregistrez normalement le token sur votre serveur/github
      // Pour l'instant, on active simplement la réception navigateur
      new Notification("Lisible", {
        body: "Notifications activées ! Vous ne manquerez plus aucun direct.",
        icon: "/icon-192.png"
      });
      setShowPrompt(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-96 z-[999] animate-in fade-in slide-in-from-bottom-10 duration-700">
      <div className="bg-slate-900 border border-white/10 p-6 rounded-[2.5rem] shadow-2xl backdrop-blur-xl">
        <button onClick={() => setShowPrompt(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
          <X size={18} />
        </button>
        
        <div className="flex gap-4 items-start">
          <div className="bg-teal-500 p-3 rounded-2xl text-white shadow-lg shadow-teal-500/20">
            <Bell size={24} className="animate-bounce" />
          </div>
          <div>
            <h4 className="text-white font-black italic tracking-tight text-lg leading-tight">
              Ne manquez aucune plume<span className="text-teal-500">.</span>
            </h4>
            <p className="text-slate-400 text-xs mt-2 font-medium leading-relaxed">
              Activez les notifications pour être alerté dès qu'un direct commence ou qu'une nouvelle archive est disponible.
            </p>
            <button 
              onClick={requestPermission}
              className="mt-5 w-full bg-white text-slate-950 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-500 hover:text-white transition-all"
            >
              Autoriser les notifications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
