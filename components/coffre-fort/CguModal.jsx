"use client";

import { X, ScrollText } from "lucide-react";
import { CGU_TEXTE, CGU_VERSION } from "@/lib/coffre-fort";

// Fenêtre des conditions du Coffre-Fort : l'utilisateur déclare sur l'honneur
// que l'œuvre est la sienne, sans IA ni plagiat.
export default function CguModal({ open, onClose, onAccept, acceptLabel = "Je déclare et je scelle" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 sm:p-6">
      <div className="bg-white rounded-[2rem] p-7 sm:p-10 max-w-lg w-full shadow-2xl relative max-h-[88vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-300 hover:text-slate-900 transition-colors"
          aria-label="Fermer"
        >
          <X size={20} />
        </button>
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-900/20 mb-5">
          <ScrollText size={26} className="text-white" />
        </div>
        <h3 className="font-serif font-black italic text-2xl text-slate-900 mb-1">
          Conditions du Coffre-Fort
        </h3>
        <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700 mb-4">
          Déclaration sur l'honneur · {CGU_VERSION}
        </p>
        <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-5 text-[13px] leading-relaxed text-slate-700 whitespace-pre-line font-medium">
          {CGU_TEXTE}
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl border-2 border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-slate-200 transition-all"
          >
            Annuler
          </button>
          <button
            onClick={onAccept}
            className="flex-[2] py-4 rounded-2xl bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all"
          >
            {acceptLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
