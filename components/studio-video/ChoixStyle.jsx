"use client";

import { Check } from "lucide-react";
import { THEMES } from "@/lib/video-studio";

// Choix du thème visuel de la vidéo.
export default function ChoixStyle({ valeur, onChange }) {
  return (
    <div className="grid sm:grid-cols-3 gap-3">
      {Object.values(THEMES).map((t) => {
        const actif = valeur === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`rounded-[1.6rem] border-2 overflow-hidden text-left transition-all ${
              actif ? "border-amber-400 shadow-xl shadow-amber-500/20" : "border-white/10 hover:border-white/30"
            }`}
          >
            <div
              className="h-36 flex flex-col items-center justify-center gap-1.5 px-4"
              style={{ background: `linear-gradient(180deg, ${t.fondHaut}, ${t.fondBas})` }}
            >
              <span className="w-14 h-1.5 rounded-full" style={{ background: t.accent }} />
              <span className="font-serif italic font-bold text-lg" style={{ color: t.texte }}>
                « Le vers danse »
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: t.doux }}>
                Lisible.biz
              </span>
            </div>
            <div className="bg-white/[0.04] px-4 py-3.5 flex items-center justify-between gap-2">
              <div>
                <p className="font-bold text-sm text-white">{t.nom}</p>
                <p className="text-[11px] text-slate-400">{t.description}</p>
              </div>
              {actif && (
                <span className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center shrink-0">
                  <Check size={14} className="text-slate-950" />
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
