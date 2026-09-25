"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Mic, MicOff, Play, Pause, Music, Link as LinkIcon, Copy, Check,
  Square, Loader2, Users, Volume2, LogIn, Radio, UserPlus, PhoneOff, Upload, Sparkles,
} from "lucide-react";
import Pusher from "pusher-js";
import { toast } from "sonner";
import { INSTRUMENTALS, instrumentalById } from "@/components/studio/instrumentals";
import { getSessionToken } from "../../../lib/session-client.js";

const PUSHER_KEY = "1da55287e2911ceb01dd";
const PUSHER_CLUSTER = "us2";
const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];
const MAX_RECORD_MS = 30 * 60 * 1000;

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("lisible_user") || "null");
  } catch {
    return null;
  }
}

async function apiDuo(payload) {
  const res = await fetch("/api/studio-duo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Erreur du studio duo");
  return data;
}

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/* ============ ÉTAPE 1 : création de session ============ */
function CreationStep({ user, onCreated }) {
  const [titre, setTitre] = useState("");
  const [loading, setLoading] = useState(false);

  const creer = async () => {
    const u = getStoredUser();
    if (!u?.email) {
      toast.error("Connectez-vous pour créer une session.");
      return;
    }
    setLoading(true);
    try {
      const data = await apiDuo({
        action: "creer",
        titre: titre.trim(),
        email: u.email,
        nom: u.penName || u.name || "Hôte",
      });
      toast.success("Session créée ! Choisissez votre instrumental.");
      onCreated(data.session);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <p className="text-slate-400 text-sm mb-1">
        Connecté en tant que <span className="text-white font-bold">{user.penName || user.name}</span>
      </p>
      <div className="bg-slate-900/70 border border-white/10 rounded-[2.5rem] p-8 md:p-10 mt-4">
        <label className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 block mb-3">
          Titre de la session
        </label>
        <input
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          placeholder="Interview"
          maxLength={120}
          className="w-full bg-slate-800/80 border border-white/10 rounded-2xl px-6 py-5 text-white text-lg font-bold placeholder:text-slate-500 outline-none focus:border-rose-500 mb-6"
        />
        <button
          onClick={creer}
          disabled={loading}
          className="w-full py-5 rounded-[1.75rem] bg-rose-500 hover:bg-rose-400 disabled:opacity-60 text-white font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.99] shadow-lg shadow-rose-900/30"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Mic size={20} />}
          Créer la session
        </button>
      </div>
    </div>
  );
}

/* ============ ÉTAPE 2 : choix de l'instrumental (avec pré-écoute) ============ */
function InstrumentalStep({ session, onDone }) {
  const [selected, setSelected] = useState(session.instrumentalId || null);
  const [playingId, setPlayingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const a = new Audio();
    a.preload = "none";
    audioRef.current = a;
    return () => {
      a.pause();
      a.src = "";
    };
  }, []);

  const togglePreview = (inst) => {
    const a = audioRef.current;
    if (!a) return;
    if (playingId === inst.id) {
      a.pause();
      setPlayingId(null);
    } else {
      a.src = inst.fichier;
      a.loop = true;
      a.volume = 0.9;
      a.play().catch(() => toast.error("Lecture impossible"));
      setPlayingId(inst.id);
    }
  };

  useEffect(() => {
    const a = audioRef.current;
    const onEnd = () => setPlayingId(null);
    a?.addEventListener("pause", onEnd);
    return () => a?.removeEventListener("pause", onEnd);
  }, []);

  const continuer = async () => {
    const u = getStoredUser();
    setLoading(true);
    try {
      await apiDuo({ action: "instrumental", id: session.id, email: u.email, instrumentalId: selected });
      audioRef.current?.pause();
      setPlayingId(null);
      onDone(selected);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-black text-white mb-1 flex items-center gap-2">
        <Music size={24} className="text-rose-400" /> Fond musical
      </h2>
      <p className="text-slate-400 text-sm mb-6">
        Écoutez chaque instrumental avant de choisir — touchez <Play size={12} className="inline" /> pour la pré-écoute.
      </p>
      <div className="grid sm:grid-cols-2 gap-3 mb-8">
        {INSTRUMENTALS.map((inst) => {
          const isSel = selected === inst.id;
          const isPlay = playingId === inst.id;
          return (
            <div
              key={inst.id}
              onClick={() => setSelected(inst.id)}
              className={`cursor-pointer rounded-3xl border-2 p-4 flex items-center gap-4 transition-all ${
                isSel ? "border-rose-500 bg-rose-500/10" : "border-white/10 bg-white/5 hover:border-white/25"
              }`}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePreview(inst);
                }}
                aria-label={isPlay ? "Arrêter la pré-écoute" : "Pré-écouter"}
                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  isPlay ? "bg-rose-500 text-white animate-pulse" : "bg-white text-slate-900 hover:scale-105"
                }`}
              >
                {isPlay ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className="font-black text-white truncate">{inst.nom}</p>
                <p className="text-xs text-slate-400 truncate">{inst.ambiance}</p>
                {isPlay && (
                  <div className="flex items-end gap-1 h-4 mt-1">
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className="w-1 bg-rose-400 rounded-full animate-pulse"
                        style={{ height: `${8 + (i % 3) * 6}px`, animationDelay: `${i * 0.12}s` }}
                      />
                    ))}
                  </div>
                )}
              </div>
              {isSel && <Check size={20} className="text-rose-400 shrink-0" />}
            </div>
          );
        })}
      </div>
      <button
        onClick={continuer}
        disabled={loading || !selected}
        className="w-full py-5 rounded-[1.75rem] bg-rose-500 hover:bg-rose-400 disabled:opacity-40 text-white font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 transition-all shadow-lg shadow-rose-900/30"
      >
        {loading ? <Loader2 className="animate-spin" size={20} /> : <Radio size={20} />}
        Ouvrir le studio
      </button>
      <p className="text-center text-xs text-slate-500 mt-3">Sans instrumental, l'enregistrement se fera a cappella.</p>
    </div>
  );
}

/* ============ ÉTAPE 3 : studio duo (WebRTC + mixage direct) ============ */
function StudioStep({ session, instrumentalId, user }) {
  const [sess, setSess] = useState(session);
  const [invites, setInvites] = useState(session.invites || []);
  const [ready, setReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordMs, setRecordMs] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [musicVol, setMusicVol] = useState(0.3);
  const [copied, setCopied] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [done, setDone] = useState(false);

  const micStreamRef = useRef(null);
  const ctxRef = useRef(null);
  const mixDestRef = useRef(null);
  const musicGainRef = useRef(null);
  const musicSrcRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const peersRef = useRef(new Map());
  const guestNodesRef = useRef(new Map());
  const pusherRef = useRef(null);
  const sessRef = useRef(session);
  sessRef.current = sess;

  const instrumental = instrumentalById(instrumentalId);
  const inviteLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/studio/duo/invitation?room=${sess.id}`
      : "";

  const sendSignal = useCallback(
    (to, payload) => {
      apiDuo({ action: "signal", id: sessRef.current.id, from: "hote", to, payload }).catch(() => {});
    },
    []
  );

  const attachGuestAudio = useCallback((guestId, stream) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    // Nettoyer l'ancien nœud éventuel
    const old = guestNodesRef.current.get(guestId);
    if (old) {
      try { old.src.disconnect(); old.gain.disconnect(); } catch {}
    }
    const src = ctx.createMediaStreamSource(stream);
    const gain = ctx.createGain();
    gain.gain.value = 1.0;
    src.connect(gain);
    gain.connect(mixDestRef.current); // dans le mix enregistré
    gain.connect(ctx.destination); // l'hôte entend l'invité
    guestNodesRef.current.set(guestId, { src, gain, stream });
  }, []);

  const handleOffer = useCallback(
    async (from, sdp) => {
      try {
        // Fermer une éventuelle ancienne connexion
        const old = peersRef.current.get(from);
        if (old) { try { old.close(); } catch {} }
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        peersRef.current.set(from, pc);
        pc.ontrack = (e) => {
          if (e.streams[0]) attachGuestAudio(from, e.streams[0]);
        };
        pc.onicecandidate = (e) => {
          if (e.candidate) sendSignal(from, { type: "ice", candidate: e.candidate });
        };
        await pc.setRemoteDescription({ type: "offer", sdp });
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendSignal(from, { type: "answer", sdp: answer.sdp });
      } catch (e) {
        console.error("handleOffer:", e);
        toast.error("Connexion invité impossible");
      }
    },
    [attachGuestAudio, sendSignal]
  );

  const handleSignal = useCallback(
    async ({ from, to, payload }) => {
      if (to !== "hote" || !payload) return;
      if (payload.type === "offer") {
        await handleOffer(from, payload.sdp);
      } else if (payload.type === "ice") {
        const pc = peersRef.current.get(from);
        if (pc && payload.candidate) {
          try { await pc.addIceCandidate(payload.candidate); } catch {}
        }
      }
    },
    [handleOffer]
  );

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/studio-duo?id=${sessRef.current.id}`, { cache: "no-store" });
      const data = await res.json();
      if (data.session) {
        setSess(data.session);
        setInvites(data.session.invites || []);
        if (data.session.statut === "terminee") setDone(true);
      }
    } catch {}
  }, []);

  // Initialisation : micro + mixage + Pusher
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          micStream.getTracks().forEach((t) => t.stop());
          return;
        }
        micStreamRef.current = micStream;

        const Ctx = window.AudioContext || window.webkitAudioContext;
        const ctx = new Ctx();
        ctxRef.current = ctx;
        const mixDest = ctx.createMediaStreamDestination();
        mixDestRef.current = mixDest;

        // Micro -> mix
        const micSrc = ctx.createMediaStreamSource(micStream);
        micSrc.connect(mixDest);

        // Instrumental -> mix (+ retour casque/haut-parleur pour l'hôte)
        if (instrumental) {
          try {
            const resp = await fetch(instrumental.fichier);
            const buf = await resp.arrayBuffer();
            const audioBuf = await ctx.decodeAudioData(buf);
            const src = ctx.createBufferSource();
            src.buffer = audioBuf;
            src.loop = true;
            const g = ctx.createGain();
            g.gain.value = musicVol;
            src.connect(g);
            g.connect(mixDest);
            g.connect(ctx.destination);
            src.start();
            musicSrcRef.current = src;
            musicGainRef.current = g;
          } catch (e) {
            console.error("Instrumental:", e);
            toast.error("Instrumental indisponible, enregistrement a cappella.");
          }
        }

        // Pusher : signalisation + présence
        const pusher = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER, forceTLS: true });
        pusherRef.current = pusher;
        const channel = pusher.subscribe(`duo-${sessRef.current.id}`);
        channel.bind("signal", handleSignal);
        channel.bind("invite-rejoint", (d) => {
          setInvites(d.invites || []);
          toast.success(`${d.nom} a rejoint le studio !`);
        });
        channel.bind("invite-quitte", (d) => {
          setInvites(d.invites || []);
          const pc = peersRef.current.get(d.nom);
          if (pc) { try { pc.close(); } catch {} peersRef.current.delete(d.nom); }
          const nodes = guestNodesRef.current.get(d.nom);
          if (nodes) { try { nodes.src.disconnect(); nodes.gain.disconnect(); } catch {} guestNodesRef.current.delete(d.nom); }
        });

        await refreshSession();
        setReady(true);
      } catch (e) {
        console.error(e);
        toast.error("Microphone inaccessible. Autorisez le micro pour enregistrer.");
      }
    })();
    return () => {
      cancelled = true;
      try { pusherRef.current?.unsubscribe(`duo-${sessRef.current.id}`); pusherRef.current?.disconnect(); } catch {}
      peersRef.current.forEach((pc) => { try { pc.close(); } catch {} });
      peersRef.current.clear();
      try { musicSrcRef.current?.stop(); } catch {}
      try { ctxRef.current?.close(); } catch {}
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Volume musique
  useEffect(() => {
    if (musicGainRef.current && ctxRef.current) {
      musicGainRef.current.gain.setTargetAtTime(musicVol, ctxRef.current.currentTime, 0.05);
    }
  }, [musicVol]);

  // Minuteur d'enregistrement
  useEffect(() => {
    if (!recording) return;
    const start = Date.now() - recordMs;
    const t = setInterval(() => {
      const elapsed = Date.now() - start;
      setRecordMs(elapsed);
      if (elapsed >= MAX_RECORD_MS) {
        clearInterval(t);
        stopRecording();
        toast.warning("Limite de 30 minutes atteinte !");
      }
    }, 500);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording]);

  const toggleMic = () => {
    const track = micStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setMicOn(track.enabled);
    }
  };

  const startRecording = async () => {
    try {
      await ctxRef.current?.resume();
      await apiDuo({ action: "demarrer", id: sess.id, email: user.email });
      chunksRef.current = [];
      const rec = new MediaRecorder(mixDestRef.current.stream);
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.start(1000);
      recorderRef.current = rec;
      setRecordMs(0);
      setRecording(true);
      toast.success("Enregistrement en cours — voix + musique + invités mixés en direct.");
    } catch (e) {
      toast.error(e.message || "Impossible de démarrer l'enregistrement");
    }
  };

  const stopRecording = () => {
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") {
      rec.onstop = () => publishEpisode();
      rec.stop();
    }
    setRecording(false);
  };

  const publishEpisode = async () => {
    setPublishing(true);
    const t = toast.loading("Publication de l'épisode duo...");
    try {
      const blob = new Blob(chunksRef.current, { type: recorderRef.current?.mimeType || "audio/webm" });
      const formData = new FormData();
      formData.append("file", blob, `duo-${sess.id}.webm`);
      formData.append("sessionToken", getSessionToken() || "");
      const upRes = await fetch("/api/podcasts/upload", { method: "POST", body: formData });
      if (!upRes.ok) throw new Error("Échec du téléversement audio");
      const { url } = await upRes.json();

      const guestNames = invites.map((i) => i.nom).join(" & ");
      const regRes = await fetch("/api/podcasts/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addPodcast",
          sessionToken: getSessionToken(),
          podcastData: {
            id: crypto.randomUUID(),
            title: `${sess.titre} — Duo${guestNames ? ` avec ${guestNames}` : ""}`,
            audioUrl: url,
            hostName: user.penName || user.name || "Hôte",
            hostEmail: user.email,
            duration: formatTime(recordMs),
            instrumental: instrumental?.nom || null,
            guests: invites.map((i) => i.nom),
            createdAt: new Date().toISOString(),
            views: 0,
          },
        }),
      });
      if (!regRes.ok) throw new Error("Échec de l'enregistrement de l'épisode");

      await apiDuo({ action: "terminer", id: sess.id, email: user.email, episode: { audioUrl: url } });
      toast.success("Épisode duo publié !", { id: t });
      setDone(true);
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Échec de la publication", { id: t });
    } finally {
      setPublishing(false);
    }
  };

  const endSession = async () => {
    if (recording) {
      toast.error("Arrêtez d'abord l'enregistrement.");
      return;
    }
    try {
      await apiDuo({ action: "terminer", id: sess.id, email: user.email });
      setDone(true);
      toast.info("Session terminée.");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success("Lien d'invitation copié !");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copie impossible");
    }
  };

  if (done) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <div className="w-20 h-20 rounded-full bg-teal-500/15 border border-teal-500/30 flex items-center justify-center mx-auto mb-6">
          <Check size={36} className="text-teal-400" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Session terminée</h2>
        <p className="text-slate-400 text-sm mb-8">Merci d'avoir enregistré en duo sur Lisible.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/studio/podcast" className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-sm font-bold">
            Mes podcasts
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white text-sm font-black uppercase tracking-widest"
          >
            Nouvelle session
          </button>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <Loader2 size={48} className="animate-spin mx-auto text-rose-400 mb-6" />
        <h2 className="text-xl font-black text-white mb-2">Préparation du studio…</h2>
        <p className="text-sm text-slate-500">Autorisez votre microphone si le navigateur vous le demande.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Titre + statut */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            {recording && (
              <span className="bg-rose-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> REC
              </span>
            )}
            <span className="font-black tabular-nums text-amber-300 text-lg">{formatTime(recordMs)}</span>
          </div>
          <h2 className="text-2xl font-black text-white">{sess.titre}</h2>
          <p className="text-xs text-slate-500">
            {instrumental ? `Fond musical : ${instrumental.nom}` : "Sans fond musical"} • {invites.length}/2 invité(s)
          </p>
        </div>
        <button
          onClick={endSession}
          className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 text-xs font-black uppercase tracking-widest"
        >
          Terminer la session
        </button>
      </div>

      {/* Lien d'invitation */}
      <div className="rounded-3xl bg-teal-500/10 border border-teal-500/30 p-4 flex flex-wrap items-center gap-3 mb-6">
        <UserPlus size={18} className="text-teal-400 shrink-0" />
        <code className="flex-1 min-w-[200px] text-sm text-teal-200 break-all">{inviteLink}</code>
        <button
          onClick={copyLink}
          className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-black text-xs uppercase tracking-widest flex items-center gap-2"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copié !" : "Copier"}
        </button>
      </div>
      <p className="text-xs text-slate-500 mb-6 -mt-3">
        Partagez ce lien à vos invités (2 maximum). Ils rejoignent depuis leur téléphone ou ordinateur, sans compte requis.
      </p>

      {/* Invités */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {[0, 1].map((slot) => {
          const inv = invites[slot];
          return (
            <div
              key={slot}
              className={`rounded-3xl border p-6 text-center ${
                inv ? "border-teal-500/40 bg-teal-500/5" : "border-dashed border-white/15 bg-white/[0.02]"
              }`}
            >
              {inv ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center mx-auto mb-3">
                    <Users size={28} className="text-teal-300" />
                  </div>
                  <p className="font-black text-white">{inv.nom}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-teal-400 mt-1">Connecté au studio</p>
                </>
              ) : (
                <div className="opacity-40 py-2">
                  <UserPlus size={28} className="mx-auto text-slate-600 mb-2" />
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">En attente d'invité…</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Contrôles */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-5">
        {instrumental && (
          <div>
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-2">
              <Volume2 size={14} /> Volume du fond musical — {instrumental.nom}
            </label>
            <input
              type="range"
              min={0}
              max={0.8}
              step={0.01}
              value={musicVol}
              onChange={(e) => setMusicVol(Number(e.target.value))}
              className="w-full accent-rose-500"
            />
          </div>
        )}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={toggleMic}
            aria-label="Micro"
            className={`p-5 rounded-full transition-all ${micOn ? "bg-white text-black" : "bg-rose-500 text-white"}`}
          >
            {micOn ? <Mic size={22} /> : <MicOff size={22} />}
          </button>
          {!recording ? (
            <button
              onClick={startRecording}
              className="px-10 py-5 rounded-full bg-rose-500 hover:bg-rose-400 text-white font-black uppercase tracking-widest text-sm flex items-center gap-3 shadow-lg shadow-rose-900/40 transition-all active:scale-95"
            >
              <span className="w-3 h-3 bg-white rounded-full animate-pulse" /> Enregistrer le duo
            </button>
          ) : (
            <button
              onClick={stopRecording}
              disabled={publishing}
              className="px-10 py-5 rounded-full bg-white text-slate-900 font-black uppercase tracking-widest text-sm flex items-center gap-3 shadow-xl transition-all active:scale-95 disabled:opacity-60"
            >
              {publishing ? <Loader2 className="animate-spin" size={20} /> : <Square size={20} fill="currentColor" />}
              {publishing ? "Publication…" : "Arrêter et publier"}
            </button>
          )}
        </div>
        <p className="text-center text-xs text-slate-500">
          Le mixage se fait en direct : votre voix, la musique de fond et vos invités sont enregistrés ensemble.
        </p>
      </div>
    </div>
  );
}

/* ============ PAGE ============ */
export default function PodcastDuoPage() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [etape, setEtape] = useState("creation"); // creation | instrumental | studio
  const [session, setSession] = useState(null);
  const [instrumentalId, setInstrumentalId] = useState(null);

  useEffect(() => {
    setUser(getStoredUser());
    setAuthChecked(true);
    const onStorage = (e) => {
      if (e.key === "lisible_user") setUser(getStoredUser());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <main className="min-h-screen bg-[#0A0A0B] text-white pb-24">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {/* Header façon capture */}
        <div className="flex items-center justify-between py-6 border-b border-white/10">
          <Link href="/studio" className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-[0.25em]">
            <ArrowLeft size={18} /> Studio
          </Link>
          <span className="text-rose-500 text-xs font-black uppercase tracking-[0.25em] flex items-center gap-2">
            <Radio size={16} /> Podcast Duo
          </span>
        </div>

        <header className="py-10">
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter mb-4">
            Enregistrez <span className="text-rose-500">à deux.</span>
          </h1>
          <p className="text-slate-400 max-w-xl">
            Créez une session, invitez jusqu'à 2 personnes, puis enregistrez ensemble avec fond musical et mixage en direct.
          </p>
        </header>

        {!authChecked ? (
          <div className="max-w-md mx-auto text-center py-16">
            <Loader2 size={40} className="animate-spin mx-auto text-rose-400" />
          </div>
        ) : !user?.email ? (
          <div className="max-w-md mx-auto text-center bg-slate-900/70 border border-white/10 rounded-[2.5rem] p-10">
            <div className="w-16 h-16 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto mb-5">
              <Mic size={28} className="text-rose-400" />
            </div>
            <h2 className="text-xl font-black mb-2">Connectez-vous pour créer une session.</h2>
            <p className="text-sm text-slate-500 mb-6">
              Le Podcast Duo est réservé aux membres connectés. Vos invités, eux, n'ont pas besoin de compte.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white font-black uppercase tracking-widest text-sm"
            >
              <LogIn size={18} /> Se connecter
            </Link>
          </div>
        ) : etape === "creation" ? (
          <CreationStep user={user} onCreated={(s) => { setSession(s); setEtape("instrumental"); }} />
        ) : etape === "instrumental" ? (
          <InstrumentalStep
            session={session}
            onDone={(id) => { setInstrumentalId(id); setEtape("studio"); }}
          />
        ) : (
          <StudioStep session={session} instrumentalId={instrumentalId} user={user} />
        )}

        <div className="max-w-2xl mx-auto mt-12 flex items-start gap-3 text-xs text-slate-500 bg-white/[0.03] border border-white/10 rounded-2xl p-4">
          <Sparkles size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <p>
            Astuce : choisissez un instrumental calme pour les interviews et les lectures, un instrumental rythmé pour les débats.
            Vos invités entendent votre voix en direct ; la musique est mixée côté studio.
          </p>
        </div>
      </div>
    </main>
  );
}
