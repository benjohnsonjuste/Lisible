"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Clapperboard,
  Music2,
  Palette,
  Film,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Type,
  Mic,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import PrompteurVoix from "./PrompteurVoix";
import ChoixMusique from "./ChoixMusique";
import ChoixStyle from "./ChoixStyle";
import RenduExport from "./RenduExport";
import {
  decouperVersets,
  planifierSequence,
  dureeFormatee,
  MAX_VERSETS,
} from "@/lib/video-studio";

// Studio Vidéo — transforme un texte en vidéo verticale partageable.
// Réservé à l'auteur du texte. Tout le rendu se fait dans le navigateur.
export default function StudioVideo() {
  const params = useSearchParams();
  const textId = params.get("textId");

  const [etat, setEtat] = useState("chargement"); // chargement | ok | erreur | interdit
  const [texte, setTexte] = useState(null);
  const [etape, setEtape] = useState("mode"); // mode | voix | musique | style | rendu
  const [mode, setMode] = useState(null); // texte | voix
  const [voixData, setVoixData] = useState(null);
  const [musique, setMusique] = useState("nuit-etoilee.mp3");
  const [volumeMusique, setVolumeMusique] = useState(0.3);
  const [themeId, setThemeId] = useState("nuit");
  const [dureeParVers, setDureeParVers] = useState(4);

  useEffect(() => {
    if (!textId) {
      setEtat("erreur");
      return;
    }
    (async () => {
      try {
        const res = await fetch(`https://lisible.biz/api/github-db?type=text&id=${encodeURIComponent(textId)}`);
        if (!res.ok) throw new Error("Texte introuvable.");
        const j = await res.json();
        const c = j.content;
        if (!c?.content) throw new Error("Texte introuvable.");
        const stored = localStorage.getItem("lisible_user");
        const user = stored ? JSON.parse(stored) : null;
        const estAuteur =
          user?.email &&
          c.authorEmail &&
          user.email.toLowerCase().trim() === c.authorEmail.toLowerCase().trim();
        if (!estAuteur) {
          setEtat("interdit");
          return;
        }
        setTexte({
          id: textId,
          titre: c.title || "Sans titre",
          auteur: c.authorName || c.author || "Une Plume",
          contenu: c.content,
        });
        setEtat("ok");
      } catch (e) {
        toast.error(e.message);
        setEtat("erreur");
      }
    })();
  }, [textId]);

  const { versets, tronque, total } = useMemo(
    () => (texte ? decouperVersets(texte.contenu) : { versets: [], tronque: false, total: 0 }),
    [texte]
  );

  const dureeEstimee = useMemo(() => {
    if (!versets.length) return 0;
    if (mode === "voix" && voixData) {
      return planifierSequence({ versets, mode: "voix", timings: voixData.timings, dureeVoix: voixData.dureeVoix }).dureeTotale;
    }
    return planifierSequence({ versets, mode: "texte", dureeParVers }).dureeTotale;
  }, [versets, mode, voixData, dureeParVers]);

  const etapes = [
    { id: "mode", label: "Mode", icone: Film },
    ...(mode === "voix" ? [{ id: "voix", label: "Voix", icone: Mic }] : []),
    { id: "musique", label: "Musique", icone: Music2 },
    { id: "style", label: "Style", icone: Palette },
    { id: "rendu", label: "Rendu", icone: Clapperboard },
  ];
  const idxEtape = etapes.findIndex((e) => e.id === etape);

  const choisirMode = (m) => {
    setMode(m);
    setEtape(m === "voix" ? "voix" : "musique");
  };

  if (etat === "chargement") {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24 flex flex-col items-center gap-4 text-slate-400">
        <Loader2 size={32} className="animate-spin text-amber-400" />
        <p className="text-xs font-bold uppercase tracking-widest">Chargement du studio…</p>
      </div>
    );
  }

  if (etat === "erreur" || etat === "interdit") {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24 text-center">
        <AlertTriangle size={44} className="mx-auto text-amber-400 mb-5" />
        <h1 className="font-serif font-black italic text-2xl text-white mb-3">
          {etat === "interdit" ? "Réservé à l'auteur" : "Texte introuvable"}
        </h1>
        <p className="text-slate-400 mb-8">
          {etat === "interdit"
            ? "Seul l'auteur d'un texte peut créer sa vidéo."
            : "Aucun texte ne correspond à cet identifiant."}
        </p>
        <Link
          href="/coffre-fort"
          className="inline-flex px-8 py-4 rounded-2xl bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-widest hover:bg-amber-400 transition-all"
        >
          Retour
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* En-tête */}
      <div className="text-center mb-8">
        <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.25em] text-amber-300 border border-amber-500/40 bg-amber-500/10 rounded-full px-5 py-2 mb-4">
          <Clapperboard size={14} /> Studio Vidéo
        </p>
        <h1 className="font-serif font-black italic text-3xl sm:text-4xl text-white tracking-tight">
          « {texte.titre} » en vidéo
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          {versets.length} verset{versets.length > 1 ? "s" : ""} · format vertical 1080×1920
          {tronque && (
            <span className="text-amber-300"> · seuls les {MAX_VERSETS} premiers versets ({total} au total) seront utilisés</span>
          )}
        </p>
      </div>

      {/* Indicateur d'étapes */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-8">
        {etapes.map((e, i) => (
          <div key={e.id} className="flex items-center gap-1.5 sm:gap-2">
            <div
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                i === idxEtape
                  ? "bg-amber-500 text-slate-950"
                  : i < idxEtape
                    ? "bg-amber-500/20 text-amber-300"
                    : "bg-white/5 text-slate-500"
              }`}
            >
              <e.icone size={12} />
              <span className="hidden sm:inline">{e.label}</span>
            </div>
            {i < etapes.length - 1 && <div className="w-3 sm:w-5 h-px bg-white/15" />}
          </div>
        ))}
      </div>

      {/* ÉTAPE : mode */}
      {etape === "mode" && (
        <div className="grid sm:grid-cols-2 gap-4">
          <button
            onClick={() => choisirMode("texte")}
            className="bg-white/[0.04] border-2 border-white/10 hover:border-amber-500/60 rounded-[1.8rem] p-8 text-left transition-all group"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center mb-5 shadow-lg">
              <Type size={26} className="text-white" />
            </div>
            <h3 className="font-bold text-lg text-white mb-2">Texte + musique</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Le plus simple : vos versets défilent en rythme sur la musique choisie.
              Idéal pour un rendu rapide, sans enregistrement.
            </p>
          </button>
          <button
            onClick={() => choisirMode("voix")}
            className="bg-white/[0.04] border-2 border-white/10 hover:border-amber-500/60 rounded-[1.8rem] p-8 text-left transition-all group"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-red-700 flex items-center justify-center mb-5 shadow-lg">
              <Mic size={26} className="text-white" />
            </div>
            <h3 className="font-bold text-lg text-white mb-2">Ma voix</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Enregistrez-vous au micro comme dans un studio : la vidéo suit
              exactement votre déclamation, verset par verset.
            </p>
          </button>
        </div>
      )}

      {/* ÉTAPE : voix */}
      {etape === "voix" && (
        <PrompteurVoix
          versets={versets}
          onRetour={() => setEtape("mode")}
          onTermine={(d) => {
            setVoixData(d);
            setEtape("musique");
            toast.success("Voix enregistrée !");
          }}
        />
      )}

      {/* ÉTAPE : musique (+ rythme en mode texte) */}
      {etape === "musique" && (
        <div className="bg-white/[0.04] border border-white/10 rounded-[1.8rem] p-6 sm:p-8">
          <h3 className="font-bold text-white mb-1">Musique d'ambiance</h3>
          <p className="text-xs text-slate-500 mb-5">Écoutez un extrait avant de choisir.</p>
          <ChoixMusique
            valeur={musique}
            volume={volumeMusique}
            onChange={setMusique}
            onVolume={setVolumeMusique}
          />
          {mode === "texte" && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-white">Rythme de défilement</h3>
                <span className="text-xs font-black text-amber-300">{dureeParVers}s par verset</span>
              </div>
              <input
                type="range"
                min={2}
                max={8}
                step={0.5}
                value={dureeParVers}
                onChange={(e) => setDureeParVers(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
              <p className="text-xs text-slate-500 mt-2">
                Durée estimée de la vidéo : <span className="text-amber-300 font-bold">{dureeFormatee(dureeEstimee)}</span>
              </p>
            </div>
          )}
          {mode === "voix" && voixData && (
            <p className="text-xs text-slate-500 mt-6 pt-6 border-t border-white/10">
              Voix enregistrée : <span className="text-amber-300 font-bold">{dureeFormatee(voixData.dureeVoix)}</span>
              {" · "}durée estimée de la vidéo : <span className="text-amber-300 font-bold">{dureeFormatee(dureeEstimee)}</span>
            </p>
          )}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setEtape(mode === "voix" ? "voix" : "mode")}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-white/15 text-slate-300 text-xs font-black uppercase tracking-widest hover:border-white/40 transition-all"
            >
              <ChevronLeft size={15} /> Retour
            </button>
            <button
              onClick={() => setEtape("style")}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-widest hover:bg-amber-400 transition-all"
            >
              Continuer <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ÉTAPE : style */}
      {etape === "style" && (
        <div className="bg-white/[0.04] border border-white/10 rounded-[1.8rem] p-6 sm:p-8">
          <h3 className="font-bold text-white mb-1">Style visuel</h3>
          <p className="text-xs text-slate-500 mb-5">L'habillage de votre vidéo verticale.</p>
          <ChoixStyle valeur={themeId} onChange={setThemeId} />
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setEtape("musique")}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-white/15 text-slate-300 text-xs font-black uppercase tracking-widest hover:border-white/40 transition-all"
            >
              <ChevronLeft size={15} /> Retour
            </button>
            <button
              onClick={() => setEtape("rendu")}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-widest hover:bg-amber-400 transition-all"
            >
              Continuer <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ÉTAPE : rendu */}
      {etape === "rendu" && (
        <div>
          <RenduExport
            texte={texte}
            versets={versets}
            mode={mode}
            timings={voixData?.timings || []}
            dureeVoix={voixData?.dureeVoix || 0}
            audioBlob={voixData?.audioBlob || null}
            musique={musique}
            volumeMusique={volumeMusique}
            themeId={themeId}
            dureeParVers={dureeParVers}
          />
          <button
            onClick={() => setEtape("style")}
            className="mx-auto mt-6 flex items-center gap-2 px-6 py-3 rounded-2xl text-slate-500 text-xs font-black uppercase tracking-widest hover:text-slate-300 transition-all"
          >
            <ChevronLeft size={15} /> Modifier le style
          </button>
        </div>
      )}
    </div>
  );
}
