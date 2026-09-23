"use client";
import React, { useState } from "react";
import { Feather, ShieldCheck, X, BadgeCheck, Info } from "lucide-react";
import { toast } from "sonner";

/* Petit badge pour les cartes (Bibliothèque, etc.) */
export function SceauHumainBadge({ className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${className}`}
      title="Ce texte a été déclaré écrit par un humain"
    >
      <Feather size={11} className="text-amber-600" />
      Écrit par un humain
    </span>
  );
}

/* Grand sceau pour la page de lecture */
export function SceauHumainDetail({ seal }) {
  const [showInfo, setShowInfo] = useState(false);
  if (!seal?.attested) return null;
  const date = seal.date
    ? new Date(seal.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : null;
  return (
    <div className="relative">
      <button
        onClick={() => setShowInfo(!showInfo)}
        className="inline-flex items-center gap-3 bg-white border-2 border-amber-200 rounded-[1.8rem] px-6 py-4 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all text-left"
      >
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-900/20 shrink-0">
          <Feather size={22} className="text-white" />
        </div>
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-800 flex items-center gap-1.5">
            <BadgeCheck size={14} className="text-amber-600" />
            Sceau « écrit par un humain »
          </p>
          <p className="text-[10px] font-bold text-slate-400 mt-1">
            {date ? `Déclaré le ${date}` : "Déclaration de l'auteur"} {seal.authorName ? `• ${seal.authorName}` : ""} • En savoir plus
          </p>
        </div>
      </button>
      {showInfo && (
        <div className="absolute z-30 mt-3 w-80 max-w-[90vw] bg-slate-950 text-white rounded-[1.8rem] p-6 shadow-2xl text-sm leading-relaxed">
          <button onClick={() => setShowInfo(false)} className="absolute top-4 right-4 text-white/50 hover:text-white">
            <X size={16} />
          </button>
          <p className="font-black uppercase text-[10px] tracking-[0.25em] text-amber-400 mb-3 flex items-center gap-2">
            <ShieldCheck size={14} /> L'engagement de la plume
          </p>
          <p className="text-white/85">
            L'auteur déclare sur l'honneur que ce texte est né de sa plume : il n'a pas été
            généré intégralement par une intelligence artificielle.
          </p>
          <p className="text-white/60 mt-3 text-[13px]">
            Une aide ponctuelle reste possible (correction orthographique, reformulation légère),
            mais l'invention, le style et le souffle sont humains.
          </p>
          {date && <p className="text-amber-300/80 mt-4 text-[11px] font-bold uppercase tracking-widest">Scellé le {date}</p>}
        </div>
      )}
    </div>
  );
}

/* Bloc d'adhésion pour la page Publier */
export function SceauHumainChoix({ checked, onChange }) {
  return (
    <div className="bg-gradient-to-br from-amber-50/80 to-white border-2 border-amber-100 rounded-[2.5rem] p-8 md:p-10 shadow-sm">
      <div className="flex items-start gap-5">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-900/20 shrink-0">
          <Feather size={26} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-serif font-black italic text-2xl text-slate-900 tracking-tight">
            Le Sceau « écrit par un humain »
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed mt-2">
            Apposez sur votre œuvre le sceau des plumes humaines. En le demandant, vous déclarez
            sur l'honneur que ce texte est né de votre plume et n'a pas été généré intégralement
            par une intelligence artificielle.
          </p>
          <label className="mt-6 flex items-start gap-4 cursor-pointer group">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => onChange(e.target.checked)}
              className="mt-1 w-6 h-6 rounded-lg accent-amber-600 cursor-pointer"
            />
            <span className="text-sm font-bold text-slate-700 leading-relaxed group-hover:text-slate-900">
              Je demande le Sceau « écrit par un humain » pour ce texte.
              <span className="block text-[12px] font-normal text-slate-400 mt-1">
                Le sceau apparaîtra sur la page de lecture et dans la bibliothèque. Une aide
                ponctuelle (correction, reformulation légère) reste possible.
              </span>
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}

/* Bouton pour l'auteur qui veut sceller un texte déjà publié */
export function SceauHumainDemande({ textId, onSealed }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSeal = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/github-db", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: textId, action: "human_seal" }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Échec du scellé");
      toast.success("Sceau « écrit par un humain » apposé !");
      setOpen(false);
      if (onSealed) onSealed();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-6 py-3.5 bg-amber-50 border-2 border-amber-200 text-amber-800 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all"
      >
        <Feather size={14} />
        Demander le Sceau « écrit par un humain »
      </button>
      {open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-6">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setOpen(false)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-900">
              <X size={20} />
            </button>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg mb-6">
              <Feather size={28} className="text-white" />
            </div>
            <h3 className="font-serif font-black italic text-2xl text-slate-900 mb-3">Sceller ce texte ?</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              En apposant le Sceau, vous déclarez sur l'honneur que ce texte a été écrit par un
              humain et n'a pas été généré intégralement par une intelligence artificielle.
            </p>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-4 rounded-2xl border-2 border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-slate-200"
              >
                Annuler
              </button>
              <button
                onClick={handleSeal}
                disabled={loading}
                className="flex-1 py-4 rounded-2xl bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 disabled:opacity-50"
              >
                {loading ? "Scellé en cours..." : "Je déclare et je scelle"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SceauHumainBadge;
