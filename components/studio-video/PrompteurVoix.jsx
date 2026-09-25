"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, SkipForward, RotateCcw, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { dureeFormatee } from "@/lib/video-studio";

// Prompteur : l'auteur s'enregistre au micro en faisant défiler les versets.
// Chaque clic sur « Vers suivant » horodate le verset (timings rejoués au rendu).
export default function PrompteurVoix({ versets, onTermine, onRetour }) {
  const [phase, setPhase] = useState("pret"); // pret | enregistrement | traitement
  const [idx, setIdx] = useState(0);
  const [secondes, setSecondes] = useState(0);
  const [erreur, setErreur] = useState("");
  const recRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const debutRef = useRef(0);
  const timingsRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => () => {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  // Espace = vers suivant pendant l'enregistrement
  useEffect(() => {
    if (phase !== "enregistrement") return;
    const h = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        versetSuivant();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [phase, idx]);

  const demarrer = async () => {
    setErreur("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const rec = new MediaRecorder(stream);
      recRef.current = rec;
      chunksRef.current = [];
      timingsRef.current = [0];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = finaliser;
      rec.start();
      debutRef.current = performance.now();
      setIdx(0);
      setSecondes(0);
      setPhase("enregistrement");
      timerRef.current = setInterval(
        () => setSecondes((performance.now() - debutRef.current) / 1000),
        250
      );
    } catch {
      setErreur("Micro inaccessible. Autorisez l'accès au microphone puis réessayez.");
    }
  };

  const versetSuivant = () => {
    if (phase !== "enregistrement") return;
    const t = (performance.now() - debutRef.current) / 1000;
    if (idx < versets.length - 1) {
      timingsRef.current.push(t);
      setIdx(idx + 1);
    } else {
      terminer();
    }
  };

  const terminer = () => {
    clearInterval(timerRef.current);
    if (recRef.current?.state === "recording") recRef.current.stop();
    else finaliser();
    setPhase("traitement");
  };

  const finaliser = async () => {
    try {
      const blob = new Blob(chunksRef.current, { type: recRef.current?.mimeType || "audio/webm" });
      const duree = (performance.now() - debutRef.current) / 1000;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (!blob.size) throw new Error("Enregistrement vide.");
      onTermine({ audioBlob: blob, timings: timingsRef.current, dureeVoix: duree });
    } catch (e) {
      setErreur(e.message || "Échec de l'enregistrement.");
      setPhase("pret");
    }
  };

  const recommencer = () => {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setPhase("pret");
    setIdx(0);
    setSecondes(0);
  };

  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-[1.8rem] p-6 sm:p-8">
      {phase === "pret" && (
        <div className="text-center py-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center mb-5">
            <Mic size={28} className="text-amber-400" />
          </div>
          <h3 className="font-bold text-lg text-white mb-2">Enregistrez votre voix</h3>
          <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto mb-6">
            Lisez votre texte à voix haute. Cliquez sur <span className="text-amber-300 font-semibold">« Vers suivant »</span> (ou
            appuyez sur <span className="text-amber-300 font-semibold">Espace</span>) à chaque verset :
            la vidéo suivra exactement votre rythme.
          </p>
          {erreur && (
            <p className="flex items-center justify-center gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 mb-5 max-w-md mx-auto">
              <AlertTriangle size={16} /> {erreur}
            </p>
          )}
          <button
            onClick={demarrer}
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-red-600 text-white text-xs font-black uppercase tracking-widest hover:bg-red-500 transition-all shadow-xl"
          >
            <Mic size={16} /> Commencer l'enregistrement
          </button>
          <button onClick={onRetour} className="block mx-auto mt-4 text-xs text-slate-500 hover:text-slate-300 underline underline-offset-4">
            Retour
          </button>
        </div>
      )}

      {phase === "enregistrement" && (
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono font-bold text-red-300 text-lg">{dureeFormatee(secondes)}</span>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">
              Verset {idx + 1} / {versets.length}
            </span>
          </div>
          <div className="min-h-[140px] flex items-center justify-center bg-black/40 border border-white/10 rounded-3xl px-6 py-8 mb-6">
            <p className="font-serif italic font-bold text-2xl sm:text-3xl text-white leading-snug">« {versets[idx]} »</p>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2 mb-6 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all"
              style={{ width: `${((idx + 1) / versets.length) * 100}%` }}
            />
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={versetSuivant}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-widest hover:bg-amber-400 transition-all"
            >
              <SkipForward size={15} /> {idx < versets.length - 1 ? "Vers suivant" : "Dernier vers — terminer"}
            </button>
            <button
              onClick={terminer}
              className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl border border-white/20 text-slate-200 text-xs font-black uppercase tracking-widest hover:border-red-500/60 hover:text-red-300 transition-all"
            >
              <Square size={14} /> Terminer
            </button>
            <button
              onClick={recommencer}
              className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl text-slate-500 text-xs font-black uppercase tracking-widest hover:text-slate-300 transition-all"
            >
              <RotateCcw size={14} /> Recommencer
            </button>
          </div>
          <p className="text-[11px] text-slate-500 mt-4">Astuce : la touche Espace fait aussi avancer d'un verset.</p>
        </div>
      )}

      {phase === "traitement" && (
        <div className="flex flex-col items-center gap-3 py-10 text-slate-400">
          <Loader2 size={30} className="animate-spin text-amber-400" />
          <p className="text-xs font-bold uppercase tracking-widest">Préparation de votre voix…</p>
        </div>
      )}
    </div>
  );
}
