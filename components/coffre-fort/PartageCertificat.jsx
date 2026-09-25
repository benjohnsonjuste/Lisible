"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";
import { toast } from "sonner";
import { liensPartage, textePartage, URL_CERTIFICAT } from "@/lib/coffre-fort";

// Boutons de partage du certificat : X, Facebook, WhatsApp, LinkedIn, Telegram + copier le lien.
export default function PartageCertificat({ certificat, compact = false }) {
  const [copie, setCopie] = useState(false);
  if (!certificat?.id) return null;
  const liens = liensPartage(certificat);

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(
        `${textePartage(certificat)} ${URL_CERTIFICAT(certificat.id)}`
      );
      setCopie(true);
      toast.success("Lien du certificat copié !");
      setTimeout(() => setCopie(false), 2500);
    } catch {
      toast.error("Copie impossible sur cet appareil.");
    }
  };

  return (
    <div className={compact ? "" : "bg-white border border-slate-200 rounded-[1.8rem] p-6 shadow-sm"}>
      {!compact && (
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">
          Partager ce certificat
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2.5">
        {liens.map((l) => (
          <a
            key={l.nom}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all"
          >
            {l.nom}
          </a>
        ))}
        <button
          onClick={copier}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest hover:border-amber-500 hover:text-amber-700 transition-all"
        >
          {copie ? <Check size={13} className="text-emerald-600" /> : <Link2 size={13} />}
          {copie ? "Copié !" : "Copier le lien"}
        </button>
      </div>
      {!compact && (
        <p className="text-[12px] text-slate-400 mt-4 leading-relaxed italic">
          « {textePartage(certificat)} »
        </p>
      )}
    </div>
  );
}
