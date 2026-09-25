"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Vault,
  ShieldCheck,
  ShieldAlert,
  Download,
  Loader2,
  Fingerprint,
  Clock3,
  FileText,
  Hash,
} from "lucide-react";
import { toast } from "sonner";
import PartageCertificat from "@/components/coffre-fort/PartageCertificat";

export default function CertificatPage() {
  const { id } = useParams();
  const [etat, setEtat] = useState("chargement"); // chargement | ok | introuvable
  const [cert, setCert] = useState(null);
  const [verifie, setVerifie] = useState(false);
  const [dl, setDl] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/horodatage?id=${encodeURIComponent(id)}`);
        const j = await res.json();
        if (res.ok && j.success) {
          setCert(j.certificat);
          setVerifie(!!j.verifie);
          setEtat("ok");
        } else {
          setEtat("introuvable");
        }
      } catch {
        setEtat("introuvable");
      }
    })();
  }, [id]);

  const dateFr = (iso) => {
    try {
      return new Date(iso).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };
  const heureFr = (iso) => {
    try {
      return (
        new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC"
      );
    } catch {
      return "";
    }
  };

  const telecharger = async () => {
    setDl(true);
    const t = toast.loading("Génération du certificat PDF…");
    try {
      const res = await fetch("/api/horodatage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pdf", id: cert.id }),
      });
      if (!res.ok) throw new Error("Échec de la génération du PDF.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Certificat-Anteriorite-${cert.id}.pdf`;
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
    <main className="min-h-screen bg-[#faf7f0] text-slate-900">
      {/* Bandeau */}
      <div className="bg-slate-950 text-white">
        <div className="max-w-4xl mx-auto px-6 py-8 flex items-center gap-5">
          <img src="/images/logo-lisible.png" alt="Lisible" className="w-24 sm:w-28" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-300 flex items-center gap-2">
              <Vault size={13} /> Coffre-Fort d'Horodatage
            </p>
            <h1 className="font-serif font-black italic text-2xl sm:text-3xl mt-1">
              Certificat d'Antériorité Littéraire
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {etat === "chargement" && (
          <div className="flex flex-col items-center gap-4 py-20 text-slate-400">
            <Loader2 size={32} className="animate-spin" />
            <p className="text-sm font-bold uppercase tracking-widest">Vérification du certificat…</p>
          </div>
        )}

        {etat === "introuvable" && (
          <div className="text-center py-20">
            <ShieldAlert size={48} className="mx-auto text-slate-300 mb-5" />
            <h2 className="font-serif font-black italic text-2xl mb-3">Certificat introuvable</h2>
            <p className="text-slate-500 mb-8">
              Aucun certificat ne correspond à cet identifiant dans l'archive Lisible.
            </p>
            <Link
              href="/coffre-fort"
              className="inline-flex px-8 py-4 rounded-2xl bg-slate-950 text-white text-xs font-black uppercase tracking-widest hover:bg-amber-700 transition-all"
            >
              Découvrir le Coffre-Fort
            </Link>
          </div>
        )}

        {etat === "ok" && cert && (
          <>
            {/* Statut de vérification */}
            <div
              className={`flex items-center gap-4 rounded-[1.8rem] p-5 sm:p-6 mb-8 border-2 ${
                verifie
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              {verifie ? (
                <ShieldCheck size={36} className="text-emerald-600 shrink-0" />
              ) : (
                <ShieldAlert size={36} className="text-red-500 shrink-0" />
              )}
              <div>
                <p className={`font-black text-lg ${verifie ? "text-emerald-800" : "text-red-700"}`}>
                  {verifie ? "Certificat authentique — empreinte vérifiée" : "Alerte : empreinte non vérifiée"}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {verifie
                    ? "L'empreinte cryptographique recalculée correspond à celle scellée dans l'archive Lisible."
                    : "L'empreinte ne correspond pas aux archives. Contactez Lisible."}
                </p>
              </div>
            </div>

            {/* Parchemin */}
            <div className="relative bg-[#fffdf8] border-2 border-amber-200 rounded-[2rem] p-8 sm:p-12 shadow-2xl overflow-hidden">
              <div className="absolute inset-3 border border-amber-200/70 rounded-[1.6rem] pointer-events-none" />
              <div className="relative text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-700 mb-4">
                  L'archive Lisible atteste
                </p>
                <h2 className="font-serif font-black italic text-3xl sm:text-4xl leading-tight">
                  « {cert.titre} »
                </h2>
                <p className="text-slate-500 mt-3">
                  Une création originale de la plume de{" "}
                  <span className="font-bold text-slate-800">{cert.auteur}</span>
                </p>

                <div className="grid sm:grid-cols-2 gap-4 text-left mt-10">
                  <Detail icone={FileText} label="N° de certificat" valeur={cert.id} mono />
                  <Detail icone={Clock3} label="Déposé le" valeur={`${dateFr(cert.deposeLe)} à ${heureFr(cert.deposeLe)}`} />
                  {cert.type === "fichier" ? (
                    <>
                      <Detail icone={Fingerprint} label="Document scellé" valeur={`${cert.nomFichier || "?"} · ${cert.format || "?"}`} />
                      <Detail icone={Hash} label="Empreinte du document (SHA-256)" valeur={cert.hashFichier || cert.hash} mono petite />
                    </>
                  ) : (
                    <>
                      <Detail icone={Hash} label="Empreinte SHA-256" valeur={cert.hash} mono petite />
                      <Detail icone={Fingerprint} label="Volume" valeur={`${cert.mots} mots · ${cert.caracteres} caractères`} />
                    </>
                  )}
                </div>

                {/* Sceau d'encre */}
                <div className="mt-10 flex justify-center">
                  <div className="w-36 h-36 rounded-full border-[3px] border-red-800/80 flex flex-col items-center justify-center relative">
                    <div className="absolute inset-2 rounded-full border border-red-800/60" />
                    <p className="text-red-800 font-black text-sm tracking-widest">LISIBLE</p>
                    <p className="text-red-800/80 text-[10px] my-0.5">★ ★ ★</p>
                    <p className="text-red-800 font-bold text-[9px] tracking-widest">HORODATAGE</p>
                    <p className="text-red-800 font-bold text-[9px] tracking-widest">CERTIFIÉ</p>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 mt-8 uppercase tracking-widest font-bold">
                  Authentifié par Lisible.biz · Service gratuit
                </p>
              </div>
            </div>

            {/* Vérification d'un document par re-téléversement */}
            {cert.type === "fichier" && <VerificationFichier certId={cert.id} />}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mt-8">
              <button
                onClick={telecharger}
                disabled={dl}
                className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-slate-950 text-white text-xs font-black uppercase tracking-widest hover:bg-amber-700 transition-all disabled:opacity-50 shadow-lg"
              >
                {dl ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                Télécharger le PDF
              </button>
              <Link
                href="/coffre-fort"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl border-2 border-slate-200 text-xs font-black uppercase tracking-widest text-slate-600 hover:border-amber-500 hover:text-amber-700 transition-all"
              >
                <Vault size={15} /> Protéger mes œuvres
              </Link>
            </div>

            {/* Partage */}
            <div className="mt-6">
              <PartageCertificat certificat={cert} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}

// Re-téléversement d'un document pour vérifier qu'il correspond au certificat.
// Le fichier n'est jamais conservé : son empreinte est recalculée et comparée.
function VerificationFichier({ certId }) {
  const [resultat, setResultat] = useState(null); // null | true | false
  const [loading, setLoading] = useState(false);

  const verifier = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setLoading(true);
    setResultat(null);
    try {
      const fd = new FormData();
      fd.append("action", "verifier-fichier");
      fd.append("id", certId);
      fd.append("file", f);
      const res = await fetch("/api/horodatage", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j.error || "Vérification impossible.");
      setResultat(!!j.correspond);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 bg-white border-2 border-dashed border-amber-300 rounded-[1.8rem] p-6 sm:p-8">
      <p className="text-[11px] font-black uppercase tracking-[0.25em] text-amber-700 mb-2 flex items-center gap-2">
        <Fingerprint size={14} /> Vérifier l'authenticité d'un document
      </p>
      <p className="text-sm text-slate-500 leading-relaxed mb-5">
        Vous détenez le document d'origine ? Téléversez-le : son empreinte sera recalculée
        et comparée à celle scellée dans ce certificat. Le fichier n'est jamais conservé.
      </p>
      <label className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-950 text-white text-xs font-black uppercase tracking-widest hover:bg-amber-700 transition-all cursor-pointer">
        {loading ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
        {loading ? "Vérification…" : "Choisir le document à vérifier"}
        <input type="file" accept=".pdf,.doc,.docx" onChange={verifier} className="hidden" disabled={loading} />
      </label>
      {resultat === true && (
        <p className="mt-4 inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-sm rounded-2xl px-5 py-3.5">
          <ShieldCheck size={18} /> Document authentique : identique à celui scellé.
        </p>
      )}
      {resultat === false && (
        <p className="mt-4 inline-flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 font-bold text-sm rounded-2xl px-5 py-3.5">
          <ShieldAlert size={18} /> Ce fichier ne correspond pas au document scellé.
        </p>
      )}
    </div>
  );
}

function Detail({ icone: Icone, label, valeur, mono = false, petite = false }) {
  return (
    <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 flex items-center gap-1.5 mb-2">
        <Icone size={13} /> {label}
      </p>
      <p
        className={`text-slate-800 font-semibold break-all ${
          mono ? "font-mono" : ""
        } ${petite ? "text-[11px] leading-relaxed" : "text-sm"}`}
      >
        {valeur}
      </p>
    </div>
  );
}
