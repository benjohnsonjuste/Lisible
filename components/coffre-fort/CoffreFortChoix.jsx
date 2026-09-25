"use client";

import { useState } from "react";
import { Vault, FileCheck } from "lucide-react";
import CguModal from "./CguModal";

// Bloc d'adhésion sur la page Publier : sceller l'œuvre au Coffre-Fort dès sa publication.
export default function CoffreFortChoix({ checked, onChange }) {
  const [cguOpen, setCguOpen] = useState(false);

  return (
    <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-amber-500/30 rounded-[2rem] p-6 sm:p-8 shadow-xl">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center shadow-lg shrink-0">
          <Vault size={24} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-serif font-black italic text-xl text-white tracking-tight">
            Coffre-Fort d'Horodatage
          </h3>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 mt-1">
            Gratuit · Certificat officiel
          </p>
          <p className="text-sm text-slate-300/90 leading-relaxed mt-3">
            Scellez l'antériorité de votre œuvre en 1 clic : empreinte cryptographique SHA-256
            unique, horodatage certifié infalsifiable et{" "}
            <span className="text-amber-300 font-semibold">Certificat d'Ancrage Littéraire</span>{" "}
            en PDF, vérifiable publiquement.
          </p>
          <button
            type="button"
            onClick={() => setCguOpen(true)}
            className="mt-3 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-amber-300/90 hover:text-amber-200 underline underline-offset-4 decoration-amber-500/50"
          >
            <FileCheck size={14} /> Lire les conditions du Coffre-Fort
          </button>
          <label className="mt-5 flex items-start gap-4 cursor-pointer group">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => onChange(e.target.checked)}
              className="mt-1 w-6 h-6 rounded-lg accent-amber-500 cursor-pointer shrink-0"
            />
            <span className="text-sm font-bold text-white leading-relaxed group-hover:text-amber-100">
              Sceller cette œuvre au Coffre-Fort dès sa publication.
              <span className="block text-[12px] font-normal text-slate-400 mt-1">
                En cochant, vous acceptez les conditions et déclarez sur l'honneur être
                l'auteur de ce texte, écrit sans IA ni plagiat.
              </span>
            </span>
          </label>
        </div>
      </div>
      <CguModal open={cguOpen} onClose={() => setCguOpen(false)} onAccept={() => { onChange(true); setCguOpen(false); }} acceptLabel="J'accepte et je coche" />
    </div>
  );
}
