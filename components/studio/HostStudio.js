"use client";
import React, { useState, useEffect, useRef } from "react";
import { Broadcast, useCreateStream } from "@livepeer/react";
import { Mic, Video, Radio, Link as LinkIcon, StopCircle, VideoOff, MicOff, Users, Loader2 } from "lucide-react";
import Pusher from "pusher-js";
import { toast } from "sonner";

export default function HostStudio({ roomId }) {
  const [streamData, setStreamData] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [constraints, setConstraints] = useState({ video: true, audio: true });
  const [guestOnline, setGuestOnline] = useState(false);
  const [guestName, setGuestName] = useState("");

  // 1. Configuration de Pusher pour écouter l'arrivée de l'invité
  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: 'us2', // Ton cluster habituel
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

  // 2. Création du flux Livepeer avec Enregistrement (Record)
  const { mutate: createStream, data: newStream, status } = useCreateStream({
    name: `Podcast-Session-${roomId}`,
    record: true, // L'épisode sera sauvegardé automatiquement
  });

  const startBroadcast = () => {
    createStream();
    setIsRecording(true);
    toast.info("Lancement du direct et de l'enregistrement...");
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
          <h1 className="text-3xl font-black italic tracking-tighter">STUDIO LIVE</h1>
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
            <button onClick={() => window.location.reload()} className="bg-slate-800 px-8 py-3 rounded-2xl font-black text-xs flex items-center gap-2 border border-white/10">
              <StopCircle size={18} /> FIN DE SESSION
            </button>
          )}
        </div>
      </div>

      {/* Grid Vidéo */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 h-[65vh]">
        {/* Slot Hôte (Diffusion Livepeer) */}
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

        {/* Slot Invité (Placeholder ou WebRTC) */}
        <div className="relative bg-slate-900 rounded-[3rem] overflow-hidden border border-dashed border-white/10 flex flex-col items-center justify-center">
          {guestOnline ? (
            <div className="text-center">
              <div className="w-24 h-24 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-teal-500/30">
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
        <button onClick={() => setConstraints(c => ({...c, video: !c.video}))} className={`p-4 rounded-full transition-all ${constraints.video ? 'bg-white text-black' : 'bg-rose-500 text-white'}`}>
          {constraints.video ? <Video size={22} /> : <VideoOff size={22} />}
        </button>
        <button onClick={() => setConstraints(c => ({...c, audio: !c.audio}))} className={`p-4 rounded-full transition-all ${constraints.audio ? 'bg-white text-black' : 'bg-rose-500 text-white'}`}>
          {constraints.audio ? <Mic size={22} /> : <MicOff size={22} />}
        </button>
      </div>
    </div>
  );
}
