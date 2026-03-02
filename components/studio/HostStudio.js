"use client";
import React, { useState, useEffect, useRef } from "react";
import { Broadcast, useCreateStream } from "@livepeer/react";
import { Mic, Video, Radio, Link as LinkIcon, StopCircle, VideoOff, MicOff, Users, Loader2 } from "lucide-react";
import Pusher from "pusher-js";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function HostStudio({ roomId }) {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [constraints, setConstraints] = useState({ video: true, audio: true });
  const [guestOnline, setGuestOnline] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("lisible_user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  // 1. Configuration de Pusher
  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: 'us2',
    });

    const channel = pusher.subscribe(`podcast-${roomId}`);
    
    channel.bind('guest-joined', (data) => {
      setGuestOnline(true);
      setGuestName(data.name);
      toast.success(`${data.name} est entré dans le studio !`);
    });

    return () => {
      pusher.unsubscribe(`podcast-${roomId}`);
    };
  }, [roomId]);

  // 2. Livepeer
  const { mutate: createStream, data: newStream } = useCreateStream({
    name: `Podcast-Session-${roomId}`,
    record: true,
  });

  // Action : Démarrer (API START)
  const startBroadcast = async () => {
    if (!user?.email) return toast.error("Vous devez être connecté.");

    const loading = toast.loading("Initialisation du studio GitHub...");
    try {
      const res = await fetch('/api/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: "start",
          admin: user.email,
          type: "podcast",
          title: `Podcast de ${user.name || 'Admin'}`,
          guestName: guestName || null
        })
      });

      if (!res.ok) throw new Error("Accès refusé ou erreur Git");

      createStream();
      setIsRecording(true);
      toast.success("Studio prêt et enregistré !", { id: loading });
    } catch (e) {
      toast.error(e.message, { id: loading });
    }
  };

  // Action : Arrêter et Archiver (API ARCHIVE)
  const endAndArchive = async () => {
    if (!newStream?.playbackId) {
      window.location.reload();
      return;
    }

    setIsSaving(true);
    const loading = toast.loading("Archivage de l'épisode...");

    try {
      const res = await fetch('/api/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: "archive-podcast",
          admin: user.email,
          playbackId: newStream.playbackId
        })
      });

      if (res.ok) {
        toast.success("Épisode archivé avec succès !", { id: loading });
        router.push('/bibliotheque');
      } else {
        throw new Error("Erreur lors de la sauvegarde Git");
      }
    } catch (e) {
      toast.error(e.message, { id: loading });
      setIsSaving(false);
    }
  };

  const copyInvite = () => {
    const url = `${window.location.origin}/studio/guest?room=${roomId}`;
    navigator.clipboard.writeText(url);
    toast.success("Lien d'invitation copié !");
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500">STUDIO LIVE</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-rose-500 animate-pulse' : 'bg-slate-600'}`} />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              {isRecording ? "Enregistrement en cours" : "Hors Antenne"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={copyInvite} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-5 py-3 rounded-2xl border border-white/10 transition-all text-xs font-bold">
            <LinkIcon size={16} /> Inviter
          </button>
          {!isRecording ? (
            <button onClick={startBroadcast} className="bg-rose-600 hover:bg-rose-500 px-8 py-3 rounded-2xl font-black text-xs flex items-center gap-2 transition-transform active:scale-95 shadow-lg shadow-rose-900/20">
              <Radio size={18} /> LANCER L'ÉPISODE
            </button>
          ) : (
            <button 
              onClick={endAndArchive} 
              disabled={isSaving}
              className="bg-slate-800 px-8 py-3 rounded-2xl font-black text-xs flex items-center gap-2 border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-all"
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <StopCircle size={18} />}
              TERMINER ET ARCHIVER
            </button>
          )}
        </div>
      </div>

      {/* Grid Vidéo */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 h-[65vh]">
        <div className="relative bg-slate-900 rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl group">
          {isRecording && newStream?.streamKey ? (
            <Broadcast 
              streamKey={newStream.streamKey}
              video={constraints.video}
              audio={constraints.audio}
              objectFit="cover"
            />
          ) : (
             <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-black">
                <VideoOff className="text-slate-700" size={48} />
             </div>
          )}
          <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-xl px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10">
            Hôte (Vous)
          </div>
        </div>

        <div className="relative bg-slate-900 rounded-[3rem] overflow-hidden border border-dashed border-white/10 flex flex-col items-center justify-center">
          {guestOnline ? (
            <div className="text-center">
              <div className="w-24 h-24 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-teal-500/30 shadow-[0_0_30px_rgba(20,184,166,0.1)]">
                <Users className="text-teal-400" size={32} />
              </div>
              <p className="text-xl font-bold italic">{guestName}</p>
              <p className="text-[10px] font-black uppercase text-teal-400 mt-2 tracking-widest">Connecté au studio</p>
            </div>
          ) : (
            <div className="text-center opacity-40">
              <Loader2 className="animate-spin mx-auto mb-4 text-slate-600" size={32} />
              <p className="text-xs font-bold uppercase tracking-widest">En attente de l'invité...</p>
            </div>
          )}
          <div className="absolute top-6 left-6 bg-black/40 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">Invité</div>
        </div>
      </div>

      {/* Controls */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/90 backdrop-blur-2xl p-4 rounded-[2.5rem] border border-white/10 shadow-2xl z-50">
        <button onClick={() => setConstraints(c => ({...c, video: !c.video}))} className={`p-5 rounded-full transition-all ${constraints.video ? 'bg-white text-black shadow-xl shadow-white/10' : 'bg-rose-500 text-white shadow-xl shadow-rose-900/20'}`}>
          {constraints.video ? <Video size={22} /> : <VideoOff size={22} />}
        </button>
        <button onClick={() => setConstraints(c => ({...c, audio: !c.audio}))} className={`p-5 rounded-full transition-all ${constraints.audio ? 'bg-white text-black shadow-xl shadow-white/10' : 'bg-rose-500 text-white shadow-xl shadow-rose-900/20'}`}>
          {constraints.audio ? <Mic size={22} /> : <MicOff size={22} />}
        </button>
      </div>
    </div>
  );
}
