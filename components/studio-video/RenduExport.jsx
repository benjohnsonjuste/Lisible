"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  Clapperboard,
  Download,
  Loader2,
  Link2,
  Check,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  planifierSequence,
  dureeFormatee,
  urlTexte,
  THEMES,
  INTRO_DUREE,
  LARGEUR,
  HAUTEUR,
} from "@/lib/video-studio";
import { dessinerImage } from "@/lib/moteur-rendu";

function chargerImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function choisirMime() {
  if (typeof window === "undefined" || !window.MediaRecorder) return { mime: "", ext: "webm" };
  const candidats = [
    'video/mp4;codecs="avc1.42E01E,mp4a.40.2"',
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm",
  ];
  const mime = candidats.find((c) => window.MediaRecorder.isTypeSupported(c)) || "";
  return { mime, ext: mime.includes("mp4") ? "mp4" : "webm" };
}

// Rendu canvas 1080×1920 + mixage voix/musique + export via MediaRecorder.
// Tout se fait dans le navigateur : aucun coût serveur.
export default function RenduExport({
  texte,
  versets,
  mode,
  timings,
  dureeVoix,
  audioBlob,
  musique,
  volumeMusique,
  themeId,
  dureeParVers = 4,
}) {
  const canvasRef = useRef(null);
  const [phase, setPhase] = useState("pret"); // pret | generation | termine | erreur
  const [progres, setProgres] = useState(0);
  const [videoUrl, setVideoUrl] = useState(null);
  const [extension, setExtension] = useState("mp4");
  const [lienCopie, setLienCopie] = useState(false);
  const annuleRef = useRef(false);

  const theme = THEMES[themeId] || THEMES.nuit;
  const seq = planifierSequence({
    versets,
    mode,
    timings,
    dureeVoix,
    dureeParVers,
  });

  useEffect(
    () => () => {
      annuleRef.current = true;
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    },
    [videoUrl]
  );

  const generer = async () => {
    setPhase("generation");
    setProgres(0);
    annuleRef.current = false;
    const t = toast.loading("Génération de la vidéo en cours…");
    let actx = null;
    try {
      // 1. Assets visuels
      const [logo, qrUrl] = await Promise.all([
        chargerImage("/images/logo-lisible.png").catch(() => null),
        QRCode.toDataURL(urlTexte(texte.id), { width: 480, margin: 1 }),
      ]);
      if (annuleRef.current) return;
      const qr = await chargerImage(qrUrl).catch(() => null);

      // 2. Audio : voix + musique mixées
      actx = new (window.AudioContext || window.webkitAudioContext)();
      const dest = actx.createMediaStreamDestination();
      const t0 = actx.currentTime + 0.3;

      if (mode === "voix" && audioBlob) {
        const buf = await actx.decodeAudioData(await audioBlob.arrayBuffer());
        const src = actx.createBufferSource();
        src.buffer = buf;
        const g = actx.createGain();
        g.gain.value = 1.0;
        src.connect(g).connect(dest);
        src.start(t0 + INTRO_DUREE);
      }
      if (musique) {
        const res = await fetch(`/audio/instrumentals/${musique}`);
        if (!res.ok) throw new Error("Instrumental introuvable.");
        const buf = await actx.decodeAudioData(await res.arrayBuffer());
        const src = actx.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        const g = actx.createGain();
        g.gain.value = Math.max(0.02, Math.min(0.7, volumeMusique));
        src.connect(g).connect(dest);
        src.start(t0);
      }
      if (annuleRef.current) return;

      // 3. Canvas + enregistrement
      const canvas = canvasRef.current;
      const ctx2d = canvas.getContext("2d");
      const fluxVideo = canvas.captureStream(30);
      const pistes = [...fluxVideo.getVideoTracks(), ...dest.stream.getAudioTracks()];
      const { mime, ext } = choisirMime();
      setExtension(ext);
      const rec = new MediaRecorder(new MediaStream(pistes), {
        ...(mime ? { mimeType: mime } : {}),
        videoBitsPerSecond: 8_000_000,
      });
      const morceaux = [];
      rec.ondataavailable = (e) => e.data.size && morceaux.push(e.data);
      const fin = new Promise((resolve) => {
        rec.onstop = () => resolve(new Blob(morceaux, { type: mime.split(";")[0] || "video/webm" }));
      });
      rec.start(500);

      // 4. Boucle de dessin synchronisée sur l'horloge audio
      const assets = {
        theme,
        titre: texte.titre,
        auteur: texte.auteur,
        versets,
        slots: seq.slots,
        dureeTotale: seq.dureeTotale,
        logo,
        qr,
      };
      let dernierPalier = -1;
      await new Promise((resolve) => {
        const tick = () => {
          if (annuleRef.current) return resolve();
          const ecoule = actx.currentTime - t0;
          if (ecoule >= 0) dessinerImage(ctx2d, assets, Math.min(ecoule, seq.dureeTotale));
          const palier = Math.floor(ecoule * 4);
          if (palier !== dernierPalier) {
            dernierPalier = palier;
            setProgres(Math.max(0, Math.min(1, ecoule / seq.dureeTotale)));
          }
          if (ecoule >= seq.dureeTotale + 0.4) return resolve();
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      if (annuleRef.current) return;
      rec.stop();
      const blob = await fin;
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      setPhase("termine");
      toast.success("Vidéo générée !", { id: t });
    } catch (e) {
      console.error(e);
      setPhase("erreur");
      toast.error(e.message || "Échec de la génération.", { id: t });
    } finally {
      try {
        await actx?.close();
      } catch {}
    }
  };

  const copierLien = async () => {
    try {
      await navigator.clipboard.writeText(urlTexte(texte.id));
      setLienCopie(true);
      toast.success("Lien du texte copié.");
      setTimeout(() => setLienCopie(false), 2500);
    } catch {
      toast.error("Copie impossible.");
    }
  };

  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-[1.8rem] p-6 sm:p-8">
      <canvas ref={canvasRef} width={LARGEUR} height={HAUTEUR} className="hidden" />

      {phase === "pret" && (
        <div className="text-center py-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center mb-5">
            <Clapperboard size={28} className="text-amber-400" />
          </div>
          <h3 className="font-bold text-lg text-white mb-2">Prêt pour le rendu</h3>
          <p className="text-sm text-slate-400 mb-1">
            Durée estimée : <span className="text-amber-300 font-bold">{dureeFormatee(seq.dureeTotale)}</span>
            {" · "}Format vertical 1080×1920 (TikTok, Reels, Shorts)
          </p>
          <p className="text-[11px] text-slate-500 mb-6">Le rendu se fait dans votre navigateur et prend environ la durée de la vidéo.</p>
          <button
            onClick={generer}
            className="inline-flex items-center gap-2.5 px-10 py-4 rounded-2xl bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-widest hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20"
          >
            <Sparkles size={16} /> Générer ma vidéo
          </button>
        </div>
      )}

      {phase === "generation" && (
        <div className="py-10 text-center">
          <Loader2 size={32} className="animate-spin text-amber-400 mx-auto mb-5" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-300 mb-4">
            Rendu en cours… {Math.round(progres * 100)}%
          </p>
          <div className="max-w-sm mx-auto bg-white/10 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all"
              style={{ width: `${progres * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-4">Gardez cet onglet ouvert jusqu'à la fin du rendu.</p>
        </div>
      )}

      {phase === "erreur" && (
        <div className="py-8 text-center">
          <p className="flex items-center justify-center gap-2 text-sm text-red-300 mb-5">
            <AlertTriangle size={16} /> La génération a échoué. Réessayez.
          </p>
          <button
            onClick={generer}
            className="px-8 py-4 rounded-2xl bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-widest hover:bg-amber-400 transition-all"
          >
            Réessayer
          </button>
        </div>
      )}

      {phase === "termine" && videoUrl && (
        <div>
          <div className="flex justify-center mb-6">
            <video
              src={videoUrl}
              controls
              playsInline
              className="rounded-3xl border border-white/15 shadow-2xl max-h-[480px]"
            />
          </div>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <a
              href={videoUrl}
              download={`lisible-video-${texte.id}.${extension}`}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-widest hover:bg-amber-400 transition-all shadow-xl"
            >
              <Download size={15} /> Télécharger la vidéo
            </a>
            <button
              onClick={copierLien}
              className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl border border-white/20 text-slate-200 text-xs font-black uppercase tracking-widest hover:border-amber-500/60 hover:text-amber-200 transition-all"
            >
              {lienCopie ? <Check size={15} className="text-emerald-400" /> : <Link2 size={15} />}
              {lienCopie ? "Lien copié !" : "Copier le lien du texte"}
            </button>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-6">
            <p className="font-bold text-amber-200 text-sm mb-3">Pour maximiser vos vues :</p>
            <ul className="text-sm text-slate-300 space-y-2 leading-relaxed">
              <li>1. Postez sur <span className="font-semibold text-white">TikTok, Instagram Reels et YouTube Shorts</span> — la vidéo est déjà au bon format.</li>
              <li>2. Ajoutez 3 à 5 hashtags : #poésie #poesie #litterature #booktok #lisible</li>
              <li>3. Collez le lien du texte en commentaire épinglé : chaque scan du QR ou clic ramène un lecteur sur Lisible.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
