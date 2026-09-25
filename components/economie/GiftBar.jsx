"use client";
import { useState } from "react";
import { Gift, X, Sparkles } from "lucide-react";
import GiftPanel from "./GiftPanel";
import GiftAnimation from "./GiftAnimation";

/**
 * Barre "Soutenir l'auteur" à placer en bas des pages de lecture.
 * Props : destinataire { email, nom }, contexte { type:"lecture", refId, refTitre }
 */
export default function GiftBar({ destinataire, contexte }) {
  const [open, setOpen] = useState(false);
  const [event, setEvent] = useState(null);

  if (!destinataire?.email) return null;

  return (
    <>
      <div className="mt-10 mb-4 mx-auto max-w-2xl px-4">
        <div className="rounded-[2rem] border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-yellow-50 p-6 text-center shadow-lg shadow-amber-100">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles size={16} className="text-amber-500" />
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-600">Soutenez la plume</p>
            <Sparkles size={16} className="text-amber-500" />
          </div>
          <p className="text-sm font-bold text-slate-700 mb-4">
            Cette œuvre vous a touché ? Offrez un cadeau animé à <span className="text-slate-950">{destinataire.nom}</span> — 85 % lui revient.
          </p>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-slate-950 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg"
          >
            <Gift size={16} /> Offrir un cadeau
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <button onClick={() => setOpen(false)} className="absolute -top-1 right-1 z-10 p-2 rounded-full bg-white shadow-lg">
              <X size={18} />
            </button>
            <GiftPanel
              destinataire={destinataire}
              contexte={contexte}
              onSent={(ev) => { setOpen(false); setEvent(ev); }}
            />
          </div>
        </div>
      )}

      <GiftAnimation event={event} onDone={() => setEvent(null)} />
    </>
  );
}
