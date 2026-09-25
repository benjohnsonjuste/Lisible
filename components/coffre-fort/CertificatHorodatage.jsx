"use client";

import { useState } from "react";
import Link from "next/link";
import { Vault, Download, Share2, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import PartageCertificat from "./PartageCertificat";

// Carte du certificat affiché sur la page de lecture quand l'œuvre est scellée.
export default function CertificatHorodatage({ certificat, titre, auteur }) {
  const [dl, setDl] = useState(false);
  const [partageOuvert, setPartageOuvert] = useState(false);
  if (!certificat?.id) return null;

  const date = (() => {
    try {
      return new Date(certificat.deposeLe).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "";
    }
  })();

  const telecharger = async () => {
    setDl(true);
    const t = toast.loading("Génération du certificat PDF…");
    try {
      const res = await fetch("/api/horodatage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pdf", id: certificat.id }),
      });
      if (!res.ok) throw new Error("Échec de la génération du PDF.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Certificat-Anteriorite-${certificat.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Certificat téléchargé.", { id: t });
    } catch (e) {
      toast.error(e.message, { id: t });
    } finally {
      setDl(false);
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 rounded-[1.8rem] p-5 sm:p-6 shadow-xl">
      <div className="flex flex-wrap items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center shadow-lg shrink-0">
          <Vault size={22} className="text-white" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-300 flex items-center gap-1.5">
            <ShieldCheck size={14} /> Coffre-Fort d'Horodatage
          </p>
          <p className="text-[12px] text-slate-300 mt-1">
            Certificat <span className="font-mono font-bold text-amber-200">{certificat.id}</span>
            {date ? ` · scellé le ${date}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/certificat/${certificat.id}`}
            className="px-4 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/25 transition-all"
          >
            Voir le certificat
          </Link>
          <button
            onClick={telecharger}
            disabled={dl}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-950 text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all disabled:opacity-50"
          >
            {dl ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            PDF
          </button>
          <button
            onClick={() => setPartageOuvert((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-200 text-[10px] font-black uppercase tracking-widest hover:border-amber-500/60 hover:text-amber-200 transition-all"
          >
            <Share2 size={13} /> Partager
          </button>
        </div>
      </div>
      {partageOuvert && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <PartageCertificat certificat={{ id: certificat.id, titre: titre || "Sans titre", auteur: auteur || "Une Plume", deposeLe: certificat.deposeLe }} compact />
        </div>
      )}
    </div>
  );
}
