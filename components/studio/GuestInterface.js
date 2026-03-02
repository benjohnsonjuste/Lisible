"use client";
import React, { useState, useEffect, useRef } from "react";
import { Mic, Video, VideoOff, MicOff, DoorOpen, Loader2, Sparkles, Radio } from "lucide-react";
import { toast } from "sonner";

export default function GuestInterface({ roomId }) {
  const [hasJoined, setHasJoined] = useState(false);
  const [devices, setDevices] = useState({ video: true, audio: true });
  const [isConnecting, setIsConnecting] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    async function initPreview() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(devices);
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (e) { toast.error("Veuillez autoriser la caméra."); }
    }
    if (!hasJoined) initPreview();
    return () => streamRef.current?.getTracks().forEach(t => t.stop());
  }, [devices, hasJoined]);

  const handleJoin = async () => {
    setIsConnecting(true);
    const user = JSON.parse(localStorage.getItem("lisible_user") || '{"name": "Auteur Anonyme"}');

    try {
      const res = await fetch('/api/live/pusher-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: `podcast-${roomId}`,
          event: 'guest-joined',
          data: { name: user.name }
        })
      });

      if (res.ok) {
        setHasJoined(true);
        toast.success("Vous êtes en ligne !");
      }
    } catch (e) { toast.error("Échec de connexion."); }
    finally { setIsConnecting(false); }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      {!hasJoined ? (
        <div className="max-w-xl w-full bg-[#0F0F10] rounded-[3rem] p-10 border border-white/5 text-center">
          <h1 className="text-3xl font-black text-white italic mb-4">Studio d'Invité</h1>
          <div className="relative aspect-video bg-slate-900 rounded-[2rem] overflow-hidden mb-8">
            <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
          </div>
          <button onClick={handleJoin} className="w-full py-5 bg-teal-500 text-black rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3">
            {isConnecting ? <Loader2 className="animate-spin"/> : <><DoorOpen size={20}/> Rejoindre le Direct</>}
          </button>
        </div>
      ) : (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-rose-500 rounded-full flex items-center justify-center mx-auto animate-pulse shadow-[0_0_50px_rgba(244,63,94,0.3)]">
            <Radio size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-black italic text-white">VOUS ÊTES À L'ANTENNE</h2>
          <p className="text-slate-500 text-xs uppercase tracking-widest">L'hôte enregistre actuellement l'épisode</p>
        </div>
      )}
    </div>
  );
}
