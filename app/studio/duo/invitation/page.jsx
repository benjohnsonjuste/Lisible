"use client";
import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mic, Loader2, Radio, PhoneOff, Music, Check } from "lucide-react";
import Pusher from "pusher-js";
import { toast } from "sonner";
import { instrumentalById } from "@/components/studio/instrumentals";

const PUSHER_KEY = "1da55287e2911ceb01dd";
const PUSHER_CLUSTER = "us2";
const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

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

function InvitationInner() {
  const searchParams = useSearchParams();
  const room = searchParams.get("room");

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nom, setNom] = useState("");
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [connected, setConnected] = useState(false);
  const [recording, setRecording] = useState(false);
  const [ended, setEnded] = useState(false);
  const [instrumentalId, setInstrumentalId] = useState(null);

  const pcRef = useRef(null);
  const streamRef = useRef(null);
  const guestIdRef = useRef(null);
  const pusherRef = useRef(null);
  const roomRef = useRef(room);
  roomRef.current = room;

  const sendSignal = useCallback((to, payload) => {
    apiDuo({ action: "signal", id: roomRef.current, from: guestIdRef.current, to, payload }).catch(() => {});
  }, []);

  const cleanup = useCallback(() => {
    try { pcRef.current?.close(); } catch {}
    pcRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    try { pusherRef.current?.unsubscribe(`duo-${roomRef.current}`); pusherRef.current?.disconnect(); } catch {}
  }, []);

  // Charger la session
  useEffect(() => {
    if (!room) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/studio-duo?id=${room}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Session introuvable");
        setSession(data.session);
        setInstrumentalId(data.session.instrumentalId);
        if (data.session.statut === "terminee") setEnded(true);
      } catch (e) {
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    })();
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room]);

  const handleSignal = useCallback(
    async ({ from, to, payload }) => {
      if (to !== guestIdRef.current || !payload) return;
      const pc = pcRef.current;
      if (!pc) return;
      try {
        if (payload.type === "answer") {
          await pc.setRemoteDescription({ type: "answer", sdp: payload.sdp });
          setConnected(true);
          toast.success("Connecté au studio ! Parlez, l'hôte vous entend.");
        } else if (payload.type === "ice" && payload.candidate) {
          await pc.addIceCandidate(payload.candidate);
        }
      } catch (e) {
        console.error("signal invité:", e);
      }
    },
    []
  );

  const rejoindre = async () => {
    const cleanNom = nom.trim().slice(0, 60);
    if (!cleanNom) {
      toast.error("Indiquez votre nom pour rejoindre.");
      return;
    }
    setJoining(true);
    try {
      const data = await apiDuo({ action: "rejoindre", id: room, nom: cleanNom });
      setSession(data.session);
      guestIdRef.current = `invite-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      pc.onicecandidate = (e) => {
        if (e.candidate) sendSignal("hote", { type: "ice", candidate: e.candidate });
      };

      // Écouter la réponse de l'hôte AVANT d'envoyer l'offre
      const pusher = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER, forceTLS: true });
      pusherRef.current = pusher;
      const channel = pusher.subscribe(`duo-${room}`);
      channel.bind("signal", handleSignal);
      channel.bind("enregistrement-demarre", () => {
        setRecording(true);
        toast.info("L'hôte a lancé l'enregistrement — c'est à vous !");
      });
      channel.bind("session-terminee", () => {
        setEnded(true);
        setRecording(false);
      });
      channel.bind("invite-quitte", (d) => {
        if (d.nom === cleanNom) {
          setEnded(true);
        }
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignal("hote", { type: "offer", sdp: offer.sdp });

      setJoined(true);
      // Sécurité : si pas de réponse sous 20 s
      setTimeout(() => {
        if (!pcRef.current) return;
        setConnected((c) => {
          if (!c) toast.error("L'hôte ne répond pas. Vérifiez votre connexion puis réessayez.");
          return c;
        });
      }, 20000);
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Connexion impossible");
      cleanup();
    } finally {
      setJoining(false);
    }
  };

  const quitter = async () => {
    try {
      await apiDuo({ action: "quitter", id: room, nom });
    } catch {}
    cleanup();
    setJoined(false);
    setEnded(true);
  };

  const instrumental = instrumentalById(instrumentalId);

  return (
    <main className="min-h-screen bg-[#0A0A0B] text-white pb-20">
      <div className="max-w-xl mx-auto px-4">
        <div className="flex items-center justify-between py-6 border-b border-white/10">
          <Link href="/" className="text-rose-500 text-xs font-black uppercase tracking-[0.25em] flex items-center gap-2">
            <Radio size={16} /> Podcast Duo
          </Link>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Invitation invité</span>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <Loader2 size={40} className="animate-spin mx-auto text-rose-400" />
          </div>
        ) : !session ? (
          <div className="text-center py-20">
            <h1 className="text-xl font-black mb-2">Session introuvable</h1>
            <p className="text-sm text-slate-500">Ce lien d'invitation est invalide ou a expiré.</p>
          </div>
        ) : ended ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-teal-500/15 border border-teal-500/30 flex items-center justify-center mx-auto mb-5">
              <Check size={28} className="text-teal-400" />
            </div>
            <h1 className="text-xl font-black mb-2">Session terminée</h1>
            <p className="text-sm text-slate-500">Merci d'avoir participé à ce duo sur Lisible.</p>
          </div>
        ) : !joined ? (
          <div className="py-10">
            <h1 className="text-3xl font-black italic tracking-tighter mb-2">
              Rejoignez <span className="text-rose-500">le duo.</span>
            </h1>
            <p className="text-slate-400 text-sm mb-1">
              <span className="text-white font-bold">{session.hote?.nom}</span> vous invite : « {session.titre} »
            </p>
            {instrumental && (
              <p className="text-xs text-slate-500 mb-6 flex items-center gap-1.5">
                <Music size={14} className="text-rose-400" /> Fond musical : {instrumental.nom}
              </p>
            )}
            <div className="bg-slate-900/70 border border-white/10 rounded-[2rem] p-8 mt-4">
              <label className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 block mb-3">
                Votre nom
              </label>
              <input
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex : Marie"
                maxLength={60}
                className="w-full bg-slate-800/80 border border-white/10 rounded-2xl px-6 py-5 text-white text-lg font-bold placeholder:text-slate-500 outline-none focus:border-rose-500 mb-6"
              />
              <button
                onClick={rejoindre}
                disabled={joining}
                className="w-full py-5 rounded-[1.75rem] bg-rose-500 hover:bg-rose-400 disabled:opacity-60 text-white font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 shadow-lg shadow-rose-900/30"
              >
                {joining ? <Loader2 className="animate-spin" size={20} /> : <Mic size={20} />}
                Rejoindre le studio
              </button>
              <p className="text-center text-xs text-slate-500 mt-4">Aucun compte requis — votre micro suffit.</p>
            </div>
          </div>
        ) : (
          <div className="py-10 text-center">
            <div className={`w-24 h-24 rounded-full mx-auto mb-5 flex items-center justify-center border transition-all ${
              connected ? "bg-teal-500/15 border-teal-500/40" : "bg-white/5 border-white/10"
            }`}>
              {connected ? <Mic size={36} className="text-teal-300" /> : <Loader2 size={36} className="animate-spin text-slate-500" />}
            </div>
            <h1 className="text-2xl font-black mb-1">{connected ? "Vous êtes à l'antenne !" : "Connexion au studio…"}</h1>
            <p className="text-sm text-slate-500 mb-2">« {session.titre} » avec {session.hote?.nom}</p>
            {recording && (
              <span className="inline-flex items-center gap-1.5 bg-rose-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> Enregistrement en cours
              </span>
            )}
            <div className="mt-6">
              <button
                onClick={quitter}
                className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 font-black text-xs uppercase tracking-widest flex items-center gap-2 mx-auto"
              >
                <PhoneOff size={16} /> Quitter le studio
              </button>
            </div>
            <p className="text-xs text-slate-600 mt-8">Gardez cet onglet ouvert pendant l'enregistrement.</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function InvitationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center"><Loader2 className="animate-spin text-rose-400" size={40} /></div>}>
      <InvitationInner />
    </Suspense>
  );
}
