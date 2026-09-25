"use client";

import { useRef, useState } from "react";
import { Play, Pause, Music2, Volume2, Ban } from "lucide-react";
import { INSTRUMENTALS } from "@/lib/video-studio";

// Choix de l'instrumental (les 10 déjà présents sur la plateforme) + volume.
export default function ChoixMusique({ valeur, volume, onChange, onVolume }) {
  const audioRef = useRef(null);
  const [apercu, setApercu] = useState(null); // fichier en cours d'aperçu

  const basculerApercu = (f) => {
    const a = audioRef.current;
    if (!a) return;
    if (apercu === f) {
      a.pause();
      setApercu(null);
    } else {
      a.src = `/audio/instrumentals/${f}`;
      a.volume = Math.max(0.1, volume);
      a.play().catch(() => {});
      setApercu(f);
    }
  };

  return (
    <div>
      <audio ref={audioRef} onEnded={() => setApercu(null)} />
      <div className="grid sm:grid-cols-2 gap-2.5 mb-6">
        <button
          onClick={() => onChange("")}
          className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all ${
            valeur === "" ? "border-amber-500/70 bg-amber-500/10" : "border-white/10 bg-white/[0.03] hover:border-white/25"
          }`}
        >
          <Ban size={17} className="text-slate-500 shrink-0" />
          <span className="text-sm font-bold text-slate-200">Sans musique</span>
        </button>
        {INSTRUMENTALS.map((m) => (
          <div
            key={m.fichier}
            className={`flex items-center gap-3 rounded-2xl border pl-2 pr-4 py-2 transition-all ${
              valeur === m.fichier ? "border-amber-500/70 bg-amber-500/10" : "border-white/10 bg-white/[0.03] hover:border-white/25"
            }`}
          >
            <button
              onClick={() => basculerApercu(m.fichier)}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-amber-500 hover:text-slate-950 flex items-center justify-center text-white transition-all shrink-0"
              aria-label={apercu === m.fichier ? "Pause" : `Écouter ${m.nom}`}
            >
              {apercu === m.fichier ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button onClick={() => onChange(m.fichier)} className="flex-1 text-left flex items-center gap-2 min-w-0">
              <Music2 size={15} className="text-amber-400/80 shrink-0" />
              <span className="text-sm font-bold text-slate-200 truncate">{m.nom}</span>
            </button>
            {valeur === m.fichier && <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />}
          </div>
        ))}
      </div>
      {valeur !== "" && (
        <div className="flex items-center gap-4 bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4">
          <Volume2 size={18} className="text-amber-400 shrink-0" />
          <input
            type="range"
            min={5}
            max={70}
            value={Math.round(volume * 100)}
            onChange={(e) => onVolume(Number(e.target.value) / 100)}
            className="flex-1 accent-amber-500"
          />
          <span className="text-xs font-black text-slate-300 w-10 text-right">{Math.round(volume * 100)}%</span>
        </div>
      )}
    </div>
  );
}
