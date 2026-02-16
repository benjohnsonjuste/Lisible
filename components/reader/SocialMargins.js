"use client";
import React, { useState } from "react";
import { MessageCircle, Heart, Flame, Ghost, Plus } from "lucide-react";

const REACTIONS = [
  { icon: <Heart size={14} />, color: "text-rose-500", label: "Touchant" },
  { icon: <Flame size={14} />, color: "text-orange-500", label: "Puissant" },
  { icon: <Ghost size={14} />, color: "text-indigo-500", label: "Frissons" },
];

export default function SocialMargins({ children, paragraphId, reactions = [] }) {
  const [showPicker, setShowPicker] = useState(false);
  const [localReactions, setLocalReactions] = useState(reactions);

  const addReaction = (emoji) => {
    // Ici, vous ajouteriez l'appel API pour sauvegarder en DB
    setLocalReactions([...localReactions, emoji]);
    setShowPicker(false);
  };

  return (
    <div className="group relative mb-10">
      {/* Contenu du paragraphe */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Marge Interactive (Visible au hover ou si réactions présentes) */}
      <div className="absolute -right-4 sm:-right-12 top-0 h-full flex items-start gap-2 translate-x-full">
        
        {/* Affichage des réactions existantes */}
        <div className="flex flex-col gap-1">
          {localReactions.slice(0, 3).map((r, i) => (
            <div 
              key={i} 
              className="w-6 h-6 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center animate-in fade-in zoom-in duration-500"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {r.icon}
            </div>
          ))}
          {localReactions.length > 3 && (
            <span className="text-[8px] font-black text-slate-400">+{localReactions.length - 3}</span>
          )}
        </div>

        {/* Bouton d'ajout (Apparaît au hover du paragraphe) */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button 
            onClick={() => setShowPicker(!showPicker)}
            className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-xl"
          >
            <Plus size={16} />
          </button>

          {/* Sélecteur de réactions */}
          {showPicker && (
            <div className="absolute top-10 right-0 bg-white border border-slate-100 p-2 rounded-2xl shadow-2xl flex gap-2 z-50 animate-in slide-in-from-top-2">
              {REACTIONS.map((r, i) => (
                <button
                  key={i}
                  onClick={() => addReaction(r)}
                  className="p-2 hover:bg-slate-50 rounded-xl transition-colors flex flex-col items-center gap-1"
                >
                  {r.icon}
                  <span className="text-[6px] font-black uppercase tracking-tighter text-slate-400">{r.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
