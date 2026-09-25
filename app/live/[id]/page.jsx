"use client";
import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Radio, Loader2, Share2, Check, Users, Mic, Clock, Gift, X, Pause } from "lucide-react";
import Pusher from "pusher-js";
import { Player } from "@livepeer/react";
import { toast } from "sonner";
import { LivepeerProvider, PUSHER_KEY, PUSHER_CLUSTER, formatCountdown } from "@/components/live/livekit";
import LiveComments from "@/components/live/LiveComments";
import GiftPanel from "@/components/economie/GiftPanel";
import GiftAnimation from "@/components/economie/GiftAnimation";

function AudioCover({ title, hostName, avatar }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-black pointer-events-none px-6 text-center">
      <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-teal-500/50 mb-5 bg-slate-800 flex items-center justify-center">
        {avatar ? (
          <img src={avatar} alt={hostName} className="w-full h-full object-cover" />
        ) : (
          <Mic size={36} className="text-teal-400" />
        )}
      </div>
      <div className="flex items-end gap-1.5 h-14 mb-4" aria-hidden>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <span
            key={i}
            className="w-2 bg-teal-400 rounded-full animate-pulse"
            style={{ height: `${26 + ((i * 13) % 30)}px`, animationDelay: `${i * 0.12}s` }}
          />
        ))}
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-teal-400 mb-2">Live audio</p>
      <h2 className="text-xl font-black text-white">{title}</h2>
      <p className="text-sm text-slate-400 mt-1">par {hostName}</p>
    </div>
  );
}

function WatchInner({ liveId }) {
  const [live, setLive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [remaining, setRemaining] = useState(null);
  const [giftOpen, setGiftOpen] = useState(false);
  const [giftEvent, setGiftEvent] = useState(null);
  const [chatPausedUntil, setChatPausedUntil] = useState(0);

  const fetchLive = useCallback(async () => {
    try {
      const res = await fetch(`/api/lives?id=${liveId}`, { cache: "no-store" });
      const data = await res.json();
      setLive(data.live || null);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [liveId]);

  useEffect(() => {
    fetchLive();
    const t = setInterval(fetchLive, 20000);
    return () => clearInterval(t);
  }, [fetchLive]);

  // Événements temps réel de la salle
  useEffect(() => {
    const pusher = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER, forceTLS: true });
    const channel = pusher.subscribe(`live-room-${liveId}`);
    channel.bind("guest-joined", (data) => {
      setLive((prev) => prev ? { ...prev, guest: { ...(prev.guest || {}), name: data.name, status: "live", playbackId: data.playbackId } } : prev);
      toast.info(`${data.name} a rejoint l'antenne`);
    });
    channel.bind("guest-left", () => {
      setLive((prev) => prev ? { ...prev, guest: prev.guest ? { ...prev.guest, status: "invited", playbackId: null } : null } : prev);
    });
    channel.bind("live-ended", () => {
      setLive((prev) => (prev ? { ...prev, status: "ended" } : prev));
    });
    // Cadeaux Li en temps réel : tout le monde voit l'animation
    channel.bind("gift", (data) => {
      setGiftEvent(data);
      if (data.pauseChat) {
        setChatPausedUntil(Date.now() + 12000);
        toast("⏸️ Chat en pause — Grimoire d'Or !", { description: `${data.deNom} met ${data.versNom || "l'hôte"} à l'honneur.` });
      } else {
        toast.success(`${data.icone} ${data.deNom} a offert ${data.cadeauNom} !`);
      }
    });
    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`live-room-${liveId}`);
      pusher.disconnect();
    };
  }, [liveId]);

  // Compte à rebours
  useEffect(() => {
    if (!live?.endsAt || live.status !== "live") return;
    const tick = () => {
      const left = new Date(live.endsAt).getTime() - Date.now();
      setRemaining(left);
      if (left <= 0) fetchLive();
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [live?.endsAt, live?.status, fetchLive]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Lien copié !");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copie impossible");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-teal-400" size={40} />
      </div>
    );
  }

  if (!live || live.status !== "live") {
    return (
      <main className="min-h-screen bg-[#0A0A0B] text-white flex items-center justify-center px-6 pt-20">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
            <Radio size={36} className="text-slate-600" />
          </div>
          <h1 className="text-2xl font-black mb-3">Ce live est terminé</h1>
          <p className="text-sm text-slate-500 mb-8">
            {live?.title ? `« ${live.title} » n'est plus en direct.` : "Ce salon n'est pas en direct pour le moment."}
            {" "}Revenez bientôt pour les prochains lives des plumes Lisible.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/studio/live" className="px-8 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-500 font-black text-sm">
              Lancer mon live
            </Link>
            <Link href="/" className="px-8 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 font-black text-sm">
              Accueil Lisible
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isAudio = live.type === "audio";
  const guestLive = live.guest?.status === "live" && live.guest?.playbackId;

  return (
    <main className="min-h-screen bg-[#0A0A0B] text-white pt-16 md:pt-20 pb-10">
      <div className="max-w-6xl mx-auto px-4">
        {/* En-tête du salon */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-5">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center shrink-0 border border-white/10">
              {live.hostAvatar ? (
                <img src={live.hostAvatar} alt={live.hostName} className="w-full h-full object-cover" />
              ) : (
                <span className="font-black text-teal-400">{live.hostName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-rose-600 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> En direct
                </span>
                {remaining !== null && remaining > 0 && (
                  <span className="text-xs font-black tabular-nums text-amber-300 flex items-center gap-1">
                    <Clock size={12} /> {formatCountdown(remaining)}
                  </span>
                )}
              </div>
              <h1 className="text-lg md:text-xl font-black truncate">{live.title}</h1>
              <p className="text-xs text-slate-400">
                Salon de <span className="font-bold text-slate-200">{live.hostName}</span>
                {guestLive && <> • avec <span className="font-bold text-teal-300">{live.guest.name}</span></>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setGiftOpen(true)} className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-amber-500/25">
              <Gift size={16} />
              Offrir
            </button>
            <button onClick={copyLink} className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 font-black text-xs uppercase tracking-widest flex items-center gap-2">
              {copied ? <Check size={16} className="text-teal-400" /> : <Share2 size={16} />}
              {copied ? "Copié !" : "Partager"}
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-5">
          {/* Lecteur */}
          <div className="relative bg-black rounded-[1.75rem] overflow-hidden border border-white/10 aspect-video">
            {live.playbackId ? (
              <>
                <Player playbackId={live.playbackId} autoPlay muted={false} objectFit="cover" showPipButton />
                {isAudio && <AudioCover title={live.title} hostName={live.hostName} avatar={live.hostAvatar} />}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="animate-spin text-slate-600" size={32} />
              </div>
            )}

            {/* Invité en incrustation */}
            {guestLive && (
              <div className="absolute bottom-4 right-4 w-36 md:w-52 aspect-video rounded-2xl overflow-hidden border-2 border-teal-500/60 shadow-2xl z-20 bg-black">
                <Player playbackId={live.guest.playbackId} autoPlay muted={false} objectFit="cover" />
                <span className="absolute bottom-1.5 left-1.5 bg-black/70 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                  <Users size={10} /> {live.guest.name}
                </span>
              </div>
            )}
          </div>

          {/* Commentaires éphémères */}
          <div className="bg-white/[0.03] border border-white/10 rounded-[1.75rem] overflow-hidden h-[420px] lg:h-auto flex flex-col relative">
            <div className="px-5 py-3.5 border-b border-white/10">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Réactions en direct</p>
            </div>
            <div className="flex-1 min-h-0">
              <LiveComments liveId={live.id} />
            </div>
            {chatPausedUntil > Date.now() && (
              <div className="absolute inset-0 z-10 bg-black/70 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 text-center px-6">
                <Pause size={28} className="text-amber-300" />
                <p className="text-amber-200 font-black text-sm uppercase tracking-widest">Chat en pause</p>
                <p className="text-white/60 text-xs">Le Grimoire d'Or met le mécène à l'honneur…</p>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Aucune inscription requise pour assister à ce live. Les commentaires s'effacent automatiquement.
        </p>
      </div>

      {/* Modale cadeaux */}
      {giftOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setGiftOpen(false)} />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <button onClick={() => setGiftOpen(false)} className="absolute -top-1 right-1 z-10 p-2 rounded-full bg-white/10 text-white">
              <X size={18} />
            </button>
            <GiftPanel
              theme="dark"
              destinataire={{ email: live.hostEmail, nom: live.hostName }}
              contexte={{ type: "live", refId: live.id, refTitre: live.title }}
              onSent={(ev) => { setGiftOpen(false); setGiftEvent(ev); if (ev.pauseChat) setChatPausedUntil(Date.now() + 12000); }}
            />
          </div>
        </div>
      )}

      <GiftAnimation event={giftEvent} onDone={() => setGiftEvent(null)} />
    </main>
  );
}

export default function LiveWatchPage({ params }) {
  const { id } = use(params);
  return (
    <LivepeerProvider>
      <WatchInner liveId={id} />
    </LivepeerProvider>
  );
}
