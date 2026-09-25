"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Radio, Video, Mic, Link as LinkIcon, StopCircle, VideoOff, MicOff,
  Users, Loader2, ArrowLeft, Copy, Check, Clock, UserPlus, X, Search, PhoneOff, Sparkles,
} from "lucide-react";
import Pusher from "pusher-js";
import { Broadcast, useCreateStream, Player } from "@livepeer/react";
import { toast } from "sonner";
import {
  LivepeerProvider, PUSHER_KEY, PUSHER_CLUSTER, sanitizeChannel,
  getStoredUser, formatCountdown, LIVE_DURATION_MS,
} from "@/components/live/livekit";

function InviteModal({ liveId, hostEmail, onClose, onInvited }) {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/lives?users=1");
        const data = await res.json();
        setUsers((data.users || []).filter((u) => u.email !== hostEmail));
      } catch {
        toast.error("Impossible de charger les utilisateurs");
      } finally {
        setLoading(false);
      }
    })();
  }, [hostEmail]);

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(query.toLowerCase()) ||
    u.email.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 30);

  const invite = async (u) => {
    setSending(u.email);
    try {
      const res = await fetch("/api/lives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "invite-guest", liveId, email: hostEmail, guestEmail: u.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      toast.success(`${u.name} a été invité !`);
      onInvited(u);
      onClose();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg max-h-[85vh] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <UserPlus size={20} className="text-teal-600" /> Inviter un invité
          </h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10"><X size={20} /></button>
        </div>
        <div className="p-4 border-b border-slate-100 dark:border-white/10">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une plume inscrite…"
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-100 dark:bg-white/5 border border-transparent focus:border-teal-500 outline-none text-sm"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-teal-600" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-10">Aucune plume trouvée.</p>
          ) : filtered.map((u) => (
            <div key={u.email} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5">
              <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center font-black text-teal-700 dark:text-teal-300 shrink-0 overflow-hidden">
                {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : u.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{u.name}</p>
                <p className="text-xs text-slate-500 truncate">{u.email}</p>
              </div>
              <button
                onClick={() => invite(u)}
                disabled={sending === u.email}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-black uppercase tracking-wide disabled:opacity-50"
              >
                {sending === u.email ? <Loader2 size={14} className="animate-spin" /> : "Inviter"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StudioLiveInner() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [mode, setMode] = useState("idle"); // idle | starting | live | guest-join | guest-live
  const [title, setTitle] = useState("");
  const [liveType, setLiveType] = useState("video");
  const [live, setLive] = useState(null);
  const [remaining, setRemaining] = useState(LIVE_DURATION_MS);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [copied, setCopied] = useState(false);
  const [myInvites, setMyInvites] = useState([]);
  const [startError, setStartError] = useState(null);
  const warnedRef = useRef(false);

  const { mutate: createStream, data: hostStream, status: hostStatus, error: hostError, internal: hostInternal } = useCreateStream();
  const { mutate: createGuestStream, data: guestStream, status: guestStatus, error: guestError, internal: guestInternal } = useCreateStream();

  // Auth
  useEffect(() => {
    setUser(getStoredUser());
    setAuthChecked(true);
  }, []);

  // Reprendre un live existant + invitations reçues
  const refreshState = useCallback(async () => {
    const u = getStoredUser();
    if (!u?.email) return;
    try {
      const [r1, r2] = await Promise.all([
        fetch(`/api/lives?host=${encodeURIComponent(u.email)}`),
        fetch(`/api/lives?invites=${encodeURIComponent(u.email)}`),
      ]);
      const d1 = await r1.json();
      const d2 = await r2.json();
      if (d1.live && modeRef.current === "idle") {
        setLive(d1.live);
        setMode("live");
      }
      setMyInvites(d2.invites || []);
    } catch {}
  }, []);

  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    if (!authChecked || !user?.email) return;
    refreshState();
    const t = setInterval(refreshState, 20000);
    return () => clearInterval(t);
  }, [authChecked, user, refreshState]);

  // Écoute des invitations Pusher
  useEffect(() => {
    if (!user?.email) return;
    const pusher = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER, forceTLS: true });
    const channel = pusher.subscribe(sanitizeChannel(user.email));
    channel.bind("invite", (data) => {
      toast.success(`Invitation au live de ${data.hostName} !`, {
        description: `« ${data.title} » — rejoignez l'antenne depuis le Studio Live.`,
        duration: 12000,
      });
      refreshState();
    });
    return () => {
      channel.unbind_all();
      pusher.unsubscribe(sanitizeChannel(user.email));
      pusher.disconnect();
    };
  }, [user, refreshState]);

  // Écoute de la salle (invité qui rejoint / fin du live)
  useEffect(() => {
    if (!live?.id) return;
    const pusher = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER, forceTLS: true });
    const channel = pusher.subscribe(`live-room-${live.id}`);
    channel.bind("guest-joined", (data) => {
      setLive((prev) => prev ? { ...prev, guest: { ...(prev.guest || {}), name: data.name, status: "live", playbackId: data.playbackId } } : prev);
      toast.success(`${data.name} a rejoint l'antenne !`);
    });
    channel.bind("guest-left", () => {
      setLive((prev) => prev ? { ...prev, guest: prev.guest ? { ...prev.guest, status: "invited", playbackId: null } : null } : prev);
    });
    channel.bind("live-ended", () => {
      setLive(null);
      setMode("idle");
      toast.info("Le live est terminé.");
    });
    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`live-room-${live.id}`);
      pusher.disconnect();
    };
  }, [live?.id]);

  // Création du flux hôte puis enregistrement du live
  useEffect(() => {
    if (mode === "starting" && hostStream?.streamKey && hostStream?.playbackId && !live) {
      (async () => {
        try {
          const res = await fetch("/api/lives", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "create",
              email: user.email,
              name: user.penName || user.name,
              avatar: user.avatar || user.photoURL || null,
              title: title.trim() || `Live de ${user.penName || user.name}`,
              type: liveType,
              playbackId: hostStream.playbackId,
              streamKey: hostStream.streamKey,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Erreur");
          setLive(data.live);
          setMode("live");
          toast.success("Vous êtes en direct ! Partagez votre lien.");
        } catch (e) {
          toast.error(e.message);
          setMode("idle");
        }
      })();
    }
  }, [mode, hostStream, live, user, title, liveType]);

  // Compte à rebours 15 min + fin automatique
  useEffect(() => {
    if (mode !== "live" || !live?.endsAt) return;
    const tick = () => {
      const left = new Date(live.endsAt).getTime() - Date.now();
      setRemaining(left);
      if (left <= 60000 && left > 0 && !warnedRef.current) {
        warnedRef.current = true;
        toast.warning("Plus qu'une minute avant la fin du live !");
      }
      if (left <= 0) endLive();
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, live?.endsAt]);

  const startLive = () => {
    if (!user?.email) return toast.error("Connectez-vous pour lancer un live.");
    warnedRef.current = false;
    setStartError(null);
    hostInternal?.reset();
    setMode("starting");
    createStream({ name: `Live-${user.email}-${Date.now()}`, record: false });
  };

  // Erreur de création du flux hôte : on ne reste jamais bloqué sur l'écran de chargement
  useEffect(() => {
    if (mode === "starting" && hostStatus === "error") {
      const msg = hostError?.message || "Le service de live est indisponible pour le moment.";
      setStartError(`Impossible de préparer l'antenne : ${msg}`);
      setMode("idle");
      toast.error("Échec du démarrage du live.");
    }
  }, [mode, hostStatus, hostError]);

  // Erreur de création du flux invité
  useEffect(() => {
    if (mode === "guest-join" && guestStatus === "error") {
      const msg = guestError?.message || "Le service de live est indisponible pour le moment.";
      setStartError(`Impossible de rejoindre l'antenne : ${msg}`);
      setMode("idle");
      toast.error("Échec de la connexion à l'antenne.");
    }
  }, [mode, guestStatus, guestError]);

  // Sécurité : si la préparation dépasse 25 s, on affiche une erreur au lieu de tourner en boucle
  useEffect(() => {
    if (mode !== "starting" && mode !== "guest-join") return;
    const t = setTimeout(() => {
      if (modeRef.current === "starting" || modeRef.current === "guest-join") {
        setStartError("Le service de live met trop de temps à répondre. Vérifiez votre connexion puis réessayez.");
        setMode("idle");
        toast.error("Délai dépassé pour la préparation de l'antenne.");
      }
    }, 25000);
    return () => clearTimeout(t);
  }, [mode]);

  const endLive = useCallback(async () => {
    if (!live) return;
    try {
      await fetch("/api/lives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end", liveId: live.id, email: user.email }),
      });
    } catch {}
    setLive(null);
    setMode("idle");
    toast.info("Live terminé. Merci à votre audience !");
  }, [live, user]);

  const shareLink = live ? `${typeof window !== "undefined" ? window.location.origin : ""}/live/${live.id}` : "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success("Lien du live copié ! Partagez-le partout.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copie impossible");
    }
  };

  // ---- Invité : passer à l'antenne ----
  useEffect(() => {
    if (mode === "guest-join" && guestStream?.streamKey && guestStream?.playbackId && joinInviteRef.current) {
      const inv = joinInviteRef.current;
      joinInviteRef.current = null;
      (async () => {
        try {
          const res = await fetch("/api/lives", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "guest-start",
              liveId: inv.id,
              email: user.email,
              playbackId: guestStream.playbackId,
              streamKey: guestStream.streamKey,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Erreur");
          setMode("guest-live");
          toast.success("Vous êtes à l'antenne avec l'hôte !");
        } catch (e) {
          toast.error(e.message);
          setMode("idle");
        }
      })();
    }
  }, [mode, guestStream, user]);

  const joinInviteRef = useRef(null);
  const [activeInvite, setActiveInvite] = useState(null);

  const joinAsGuest = (inv) => {
    setActiveInvite(inv);
    joinInviteRef.current = inv;
    setStartError(null);
    guestInternal?.reset();
    setMode("guest-join");
    createGuestStream({ name: `Live-Invite-${user.email}-${Date.now()}`, record: false });
  };

  const leaveAsGuest = async () => {
    if (activeInvite) {
      try {
        await fetch("/api/lives", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "guest-end", liveId: activeInvite.id, email: user.email }),
        });
      } catch {}
    }
    setActiveInvite(null);
    setMode("idle");
    refreshState();
  };

  if (!authChecked) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-teal-600" size={32} /></div>;
  }

  if (!user?.email) {
    return (
      <main className="min-h-screen bg-[#fcfbf9] dark:bg-slate-950 pt-28 pb-20 px-6">
        <div className="max-w-md mx-auto text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/10 p-10 shadow-xl">
          <Radio size={48} className="mx-auto text-teal-600 mb-4" />
          <h1 className="text-2xl font-black mb-3">Studio Live</h1>
          <p className="text-sm text-slate-500 mb-6">Connectez-vous pour lancer votre live vidéo ou audio et inviter vos plumes préférées.</p>
          <Link href="/login" className="inline-block px-8 py-3 rounded-2xl bg-teal-600 text-white font-bold">Se connecter</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0B] text-white pt-20 pb-24">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="flex items-center justify-between py-6">
          <Link href="/studio" className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest">
            <ArrowLeft size={18} /> Studio
          </Link>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${mode === "live" || mode === "guest-live" ? "bg-rose-500 animate-pulse" : "bg-slate-600"}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {mode === "live" ? "En direct" : mode === "guest-live" ? "Invité à l'antenne" : "Hors antenne"}
            </span>
          </div>
        </div>

        {/* Invitations reçues */}
        {mode === "idle" && myInvites.length > 0 && (
          <div className="mb-8 rounded-3xl bg-teal-500/10 border border-teal-500/30 p-6">
            <h2 className="font-black text-lg mb-4 flex items-center gap-2 text-teal-300">
              <Sparkles size={20} /> Vous êtes invité sur un live !
            </h2>
            <div className="space-y-3">
              {myInvites.map((inv) => (
                <div key={inv.id} className="flex flex-wrap items-center gap-4 bg-black/30 rounded-2xl p-4">
                  <div className="flex-1 min-w-[200px]">
                    <p className="font-bold">{inv.title}</p>
                    <p className="text-xs text-slate-400">par {inv.hostName} • {inv.type === "audio" ? "Audio" : "Vidéo"}</p>
                  </div>
                  <button onClick={() => joinAsGuest(inv)} className="px-6 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-black font-black text-xs uppercase tracking-widest">
                    Rejoindre comme invité
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---- Formulaire de lancement ---- */}
        {mode === "idle" && (
          <div className="max-w-2xl mx-auto">
            {startError && (
              <div className="mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/40 p-5">
                <p className="font-bold text-rose-300 text-sm mb-1">Le live n'a pas pu démarrer</p>
                <p className="text-xs text-slate-400 mb-4">{startError}</p>
                <button
                  onClick={() => setStartError(null)}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-widest"
                >
                  Réessayer
                </button>
              </div>
            )}
            <h1 className="text-4xl font-black italic tracking-tighter mb-2">Lancer un <span className="text-teal-400">live</span></h1>
            <p className="text-slate-400 text-sm mb-8">Vidéo ou audio, 15 minutes d'antenne. Votre lien est partageable : même les non-inscrits peuvent vous écouter et vous voir.</p>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-2">Titre du live</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex : Lecture de mon nouveau poème"
                  maxLength={120}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-600 outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3">Format</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setLiveType("video")}
                    className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${liveType === "video" ? "border-teal-500 bg-teal-500/10" : "border-white/10 bg-black/30 hover:border-white/25"}`}
                  >
                    <Video size={28} className={liveType === "video" ? "text-teal-400" : "text-slate-500"} />
                    <span className="font-black text-sm">Vidéo</span>
                    <span className="text-[11px] text-slate-500">On vous voit et on vous entend</span>
                  </button>
                  <button
                    onClick={() => setLiveType("audio")}
                    className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${liveType === "audio" ? "border-teal-500 bg-teal-500/10" : "border-white/10 bg-black/30 hover:border-white/25"}`}
                  >
                    <Mic size={28} className={liveType === "audio" ? "text-teal-400" : "text-slate-500"} />
                    <span className="font-black text-sm">Audio</span>
                    <span className="text-[11px] text-slate-500">Voix uniquement, comme à la radio</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-black/30 rounded-2xl px-4 py-3">
                <Clock size={16} className="text-amber-400 shrink-0" />
                Durée maximale : 15 minutes. Le live se termine automatiquement.
              </div>
              <button onClick={startLive} className="w-full py-5 rounded-2xl bg-rose-600 hover:bg-rose-500 font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.99]">
                <Radio size={20} /> Passer en direct
              </button>
            </div>
          </div>
        )}

        {/* ---- Démarrage en cours ---- */}
        {mode === "starting" && (
          <div className="max-w-md mx-auto text-center py-20">
            <Loader2 size={48} className="animate-spin mx-auto text-teal-400 mb-6" />
            <h2 className="text-xl font-black mb-2">Préparation de l'antenne…</h2>
            <p className="text-sm text-slate-500">Autorisez votre caméra et votre micro si le navigateur vous le demande.</p>
          </div>
        )}

        {/* ---- Dashboard hôte en direct ---- */}
        {mode === "live" && live && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="bg-rose-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> Direct
                  </span>
                  <span className={`font-black tabular-nums ${remaining < 60000 ? "text-rose-400" : "text-amber-300"}`}>
                    {formatCountdown(remaining)}
                  </span>
                  <span className="text-xs text-slate-500 uppercase tracking-widest">{live.type === "audio" ? "Audio" : "Vidéo"}</span>
                </div>
                <h1 className="text-2xl font-black">{live.title}</h1>
              </div>
              <button onClick={endLive} className="px-6 py-3 rounded-2xl bg-slate-800 border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                <StopCircle size={18} /> Terminer le live
              </button>
            </div>

            {/* Lien de partage */}
            <div className="mb-6 rounded-2xl bg-teal-500/10 border border-teal-500/30 p-4 flex flex-wrap items-center gap-3">
              <LinkIcon size={18} className="text-teal-400 shrink-0" />
              <code className="flex-1 min-w-[200px] text-sm text-teal-200 break-all">{shareLink}</code>
              <button onClick={copyLink} className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-black text-xs uppercase tracking-widest flex items-center gap-2">
                {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copié !" : "Copier le lien"}
              </button>
              <button onClick={() => setShowInvite(true)} className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                <UserPlus size={16} /> Inviter
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-6 -mt-3">Ce lien ouvre votre salon : anyone qui clique peut voir et écouter votre live, même sans compte Lisible.</p>

            {/* Aperçu + invité */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="relative bg-black rounded-[2rem] overflow-hidden border border-white/10 aspect-video">
                {hostStream?.streamKey ? (
                  <Broadcast streamKey={hostStream.streamKey} video={liveType === "video" && camOn} audio={micOn} objectFit="cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Loader2 className="animate-spin text-slate-600" size={32} /></div>
                )}
                {liveType === "audio" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-black pointer-events-none">
                    <div className="flex items-end gap-1.5 h-16 mb-4">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <span key={i} className="w-2 bg-teal-400 rounded-full animate-pulse" style={{ height: `${30 + (i % 3) * 18}px`, animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                    <p className="text-xs uppercase tracking-widest text-slate-500">Live audio en cours</p>
                  </div>
                )}
                <span className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Vous</span>
              </div>

              <div className="relative bg-slate-900/60 rounded-[2rem] overflow-hidden border border-dashed border-white/15 aspect-video flex items-center justify-center">
                {live.guest?.status === "live" && live.guest?.playbackId ? (
                  <>
                    <Player playbackId={live.guest.playbackId} autoPlay muted={false} objectFit="cover" />
                    <span className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Invité : {live.guest.name}</span>
                  </>
                ) : live.guest ? (
                  <div className="text-center px-6">
                    <Users size={36} className="mx-auto text-teal-400 mb-3" />
                    <p className="font-bold">{live.guest.name}</p>
                    <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Invitation envoyée — en attente…</p>
                    <button onClick={async () => {
                      await fetch("/api/lives", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "cancel-invite", liveId: live.id, email: user.email }) });
                      setLive({ ...live, guest: null });
                    }} className="mt-4 text-xs text-slate-500 hover:text-rose-400 underline">Annuler l'invitation</button>
                  </div>
                ) : (
                  <div className="text-center px-6 opacity-60">
                    <UserPlus size={36} className="mx-auto text-slate-600 mb-3" />
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Aucun invité</p>
                    <button onClick={() => setShowInvite(true)} className="mt-3 px-5 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-black uppercase tracking-widest">Inviter une plume</button>
                  </div>
                )}
              </div>
            </div>

            {/* Contrôles */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-900/95 backdrop-blur-xl p-3 rounded-full border border-white/10 shadow-2xl z-50">
              {liveType === "video" && (
                <button onClick={() => setCamOn(!camOn)} className={`p-4 rounded-full transition-all ${camOn ? "bg-white text-black" : "bg-rose-500 text-white"}`} aria-label="Caméra">
                  {camOn ? <Video size={20} /> : <VideoOff size={20} />}
                </button>
              )}
              <button onClick={() => setMicOn(!micOn)} className={`p-4 rounded-full transition-all ${micOn ? "bg-white text-black" : "bg-rose-500 text-white"}`} aria-label="Micro">
                {micOn ? <Mic size={20} /> : <MicOff size={20} />}
              </button>
            </div>
          </div>
        )}

        {/* ---- Invité : préparation ---- */}
        {mode === "guest-join" && (
          <div className="max-w-md mx-auto text-center py-20">
            <Loader2 size={48} className="animate-spin mx-auto text-teal-400 mb-6" />
            <h2 className="text-xl font-black mb-2">Connexion à l'antenne…</h2>
            <p className="text-sm text-slate-500">Autorisez votre caméra et votre micro si le navigateur vous le demande.</p>
          </div>
        )}

        {/* ---- Invité à l'antenne ---- */}
        {mode === "guest-live" && activeInvite && (
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="bg-rose-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Invité à l'antenne</span>
                <h1 className="text-2xl font-black mt-2">{activeInvite.title}</h1>
                <p className="text-xs text-slate-500">avec {activeInvite.hostName}</p>
              </div>
              <button onClick={leaveAsGuest} className="px-6 py-3 rounded-2xl bg-slate-800 border border-rose-500/40 text-rose-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                <PhoneOff size={16} /> Quitter l'antenne
              </button>
            </div>
            <div className="relative bg-black rounded-[2rem] overflow-hidden border border-white/10 aspect-video">
              {guestStream?.streamKey ? (
                <Broadcast streamKey={guestStream.streamKey} video={camOn} audio={micOn} objectFit="cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Loader2 className="animate-spin text-slate-600" size={32} /></div>
              )}
              <span className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Vous (invité)</span>
            </div>
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-900/95 backdrop-blur-xl p-3 rounded-full border border-white/10 shadow-2xl z-50">
              <button onClick={() => setCamOn(!camOn)} className={`p-4 rounded-full transition-all ${camOn ? "bg-white text-black" : "bg-rose-500 text-white"}`} aria-label="Caméra">
                {camOn ? <Video size={20} /> : <VideoOff size={20} />}
              </button>
              <button onClick={() => setMicOn(!micOn)} className={`p-4 rounded-full transition-all ${micOn ? "bg-white text-black" : "bg-rose-500 text-white"}`} aria-label="Micro">
                {micOn ? <Mic size={20} /> : <MicOff size={20} />}
              </button>
            </div>
          </div>
        )}
      </div>

      {showInvite && live && (
        <InviteModal
          liveId={live.id}
          hostEmail={user.email}
          onClose={() => setShowInvite(false)}
          onInvited={(u) => setLive({ ...live, guest: { email: u.email, name: u.name, avatar: u.avatar, status: "invited" } })}
        />
      )}
    </main>
  );
}

export default function StudioLivePage() {
  return (
    <LivepeerProvider>
      <StudioLiveInner />
    </LivepeerProvider>
  );
}
