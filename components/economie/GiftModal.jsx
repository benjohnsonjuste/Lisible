"use client";
import { useState } from "react";
import { X, Gift, Send } from "lucide-react";
import GiftPanel from "./GiftPanel";
import GiftAnimation from "./GiftAnimation";
import CadeauLi from "../CadeauLi";

/**
 * Modale cadeau avec 2 onglets :
 *  - Cadeaux animés (les 7 cadeaux Li, pour le destinataire ciblé)
 *  - Transfert direct (composant historique CadeauLi)
 */
export default function GiftModal({ destinataire, contexte, onClose }) {
  const [tab, setTab] = useState("animes");
  const [event, setEvent] = useState(null);

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 md:p-6">
        <div className="relative w-full max-w-lg animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute -top-1 right-1 z-10 p-2 rounded-full bg-white shadow-lg text-slate-700"
          >
            <X size={18} />
          </button>

          <div className="flex gap-2 mb-3 bg-white rounded-2xl p-1.5 shadow-lg">
            <button
              onClick={() => setTab("animes")}
              className={`flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${tab === "animes" ? "bg-slate-950 text-white" : "text-slate-500"}`}
            >
              <Gift size={14} /> Cadeaux animés
            </button>
            <button
              onClick={() => setTab("transfert")}
              className={`flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${tab === "transfert" ? "bg-slate-950 text-white" : "text-slate-500"}`}
            >
              <Send size={14} /> Transfert direct
            </button>
          </div>

          {tab === "animes" ? (
            <GiftPanel
              destinataire={destinataire}
              contexte={contexte}
              onSent={(ev) => { onClose && onClose(); setEvent(ev); }}
            />
          ) : (
            <CadeauLi />
          )}
        </div>
      </div>

      <GiftAnimation event={event} onDone={() => setEvent(null)} />
    </>
  );
}
