"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2, Lock, FileCheck2, X } from "lucide-react";
import { toast } from "sonner";
import CguModal from "./CguModal";

const TAILLE_MAX = 20 * 1024 * 1024; // 20 Mo
const EXTENSIONS = ["pdf", "doc", "docx"];

// Téléversement + scellement d'un fichier PDF / Word au Coffre-Fort.
// Le fichier est hashé côté serveur puis oublié : il n'est jamais conservé.
export default function ScellementFichier() {
  const router = useRouter();
  const inputRef = useRef(null);
  const [fichier, setFichier] = useState(null);
  const [titre, setTitre] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const choisir = (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const ext = f.name.toLowerCase().split(".").pop();
    if (!EXTENSIONS.includes(ext)) {
      toast.error("Seuls les fichiers PDF et Word (.doc, .docx) sont acceptés.");
      return;
    }
    if (f.size > TAILLE_MAX) {
      toast.error("Fichier trop volumineux (maximum 20 Mo).");
      return;
    }
    if (!f.size) {
      toast.error("Le fichier est vide.");
      return;
    }
    setFichier(f);
  };

  const sceller = async () => {
    if (!fichier) return;
    setLoading(true);
    const t = toast.loading("Scellement du document en cours…");
    try {
      const sessionToken = localStorage.getItem("lisible_session");
      if (!sessionToken) throw new Error("Connectez-vous pour sceller un document.");
      const fd = new FormData();
      fd.append("action", "sceller-fichier");
      fd.append("file", fichier);
      fd.append("titre", titre);
      fd.append("cgu", "true");
      fd.append("sessionToken", sessionToken);
      const res = await fetch("/api/horodatage", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j.error || "Échec du scellement.");
      setOpen(false);
      toast.success(`Document scellé ! Certificat ${j.certificat.id} émis.`, { id: t });
      router.push(`/certificat/${j.certificat.id}`);
    } catch (e) {
      toast.error(e.message, { id: t });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-[1.8rem] p-6 sm:p-8">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={choisir}
        className="hidden"
      />

      {!fichier ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-amber-500/40 rounded-3xl px-6 py-10 flex flex-col items-center gap-3 hover:border-amber-400 hover:bg-amber-500/5 transition-all"
        >
          <FileUp size={36} className="text-amber-400" />
          <span className="font-bold text-white">Choisir un fichier PDF ou Word</span>
          <span className="text-xs text-slate-400">.pdf · .doc · .docx — 20 Mo maximum</span>
        </button>
      ) : (
        <div className="flex items-center gap-4 bg-amber-500/10 border border-amber-500/40 rounded-2xl px-5 py-4">
          <FileCheck2 size={28} className="text-amber-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm truncate">{fichier.name}</p>
            <p className="text-xs text-slate-400">
              {(fichier.size / (1024 * 1024)).toFixed(2)} Mo — prêt à être scellé
            </p>
          </div>
          <button
            onClick={() => setFichier(null)}
            disabled={loading}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
            aria-label="Retirer le fichier"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {fichier && (
        <div className="mt-4">
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
            Titre du document <span className="text-slate-600 normal-case font-bold">(optionnel — le nom du fichier sera utilisé sinon)</span>
          </label>
          <input
            type="text"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            maxLength={140}
            placeholder="Ex. : Mon manuscrit — version finale"
            disabled={loading}
            className="w-full bg-white/5 border border-white/15 rounded-2xl px-5 py-3.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/60 disabled:opacity-50"
          />
        </div>
      )}

      <button
        onClick={() => fichier && setOpen(true)}
        disabled={!fichier || loading}
        className="mt-5 w-full inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-widest hover:bg-amber-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xl shadow-amber-500/20"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={15} />}
        {loading ? "Scellement en cours…" : "Sceller ce document"}
      </button>

      <p className="text-[11px] text-slate-500 leading-relaxed mt-4 flex items-start gap-2">
        <Lock size={12} className="mt-0.5 shrink-0 text-amber-500/70" />
        Confidentialité garantie : votre fichier est analysé puis immédiatement oublié.
        Seule son empreinte cryptographique SHA-256 est archivée dans le certificat.
      </p>

      <CguModal
        open={open}
        onClose={() => !loading && setOpen(false)}
        onAccept={sceller}
        acceptLabel={loading ? "Scellement en cours…" : "Je déclare et je scelle"}
      />
    </div>
  );
}
