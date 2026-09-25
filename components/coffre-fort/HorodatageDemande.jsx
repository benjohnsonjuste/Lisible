"use client";

import { useState } from "react";
import { Vault, Loader2, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import CguModal from "./CguModal";

// Bouton « Sceller » pour l'auteur sur la page de lecture d'un texte déjà publié.
export default function HorodatageDemande({ textId, onSealed }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const sceller = async () => {
    setLoading(true);
    const t = toast.loading("Scellement au Coffre-Fort en cours…");
    try {
      const sessionToken = localStorage.getItem("lisible_session");
      const res = await fetch("/api/horodatage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sceller", textId, sessionToken, cgu: true }),
      });
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j.error || "Échec du scellement.");
      setOpen(false);
      toast.success(
        j.dejaScelle
          ? "Cette œuvre était déjà scellée."
          : `Œuvre scellée ! Certificat ${j.certificat.id} émis.`,
        { id: t }
      );
      if (onSealed) onSealed();
    } catch (e) {
      toast.error(e.message, { id: t });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.18em] hover:bg-amber-700 transition-all shadow-lg"
      >
        <Vault size={15} className="text-amber-400" />
        Sceller au Coffre-Fort
      </button>
      <CguModal
        open={open}
        onClose={() => !loading && setOpen(false)}
        onAccept={sceller}
        acceptLabel={loading ? "Scellement en cours…" : "Je déclare et je scelle"}
      />
      {loading && (
        <span className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          <Loader2 size={14} className="animate-spin" /> Scellement…
        </span>
      )}
    </>
  );
}

// Petit badge doré pour les cartes (bibliothèque, etc.)
export function CertificatBadge({ className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-100 to-amber-200 border border-amber-300 text-amber-900 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${className}`}
      title="Antériorité de cette œuvre certifiée par le Coffre-Fort Lisible"
    >
      <BadgeCheck size={11} className="text-amber-700" />
      Antériorité certifiée
    </span>
  );
}
