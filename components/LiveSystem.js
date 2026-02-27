"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { 
  Video, Mic, MessageSquare, Heart, Share2, Users, 
  X, Radio, Send, ShieldCheck, Loader2, Volume2, VideoOff, UserPlus
} from "lucide-react";
import { toast } from "sonner";
import InviteModal from "./InviteModal";

export default function LiveSystem({ currentUser, isAdmin }) {
  const [isLive, setIsLive] = useState(false);
  const [liveData, setLiveData] = useState(null);
  const [comment, setComment] = useState("");
  const [reactions, setReactions] = useState([]); 
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [streamType, setStreamType] = useState(null); // 'audio' ou 'video'
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // 1. SURVEILLANCE DU LIVE (Pour les spectateurs et l'initialisation)
  const checkLiveStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/live");
      if (res.ok) {
        const data = await res.json();
        setLiveData(data);
        if (data.isActive && !isAdmin) {
          setIsLive(true);
          setStreamType(data.type);
        }
      }
    } catch (e) { console.error("Erreur de statut live"); }
  }, [isAdmin]);

  useEffect(() => {
    checkLiveStatus();
    const interval = setInterval(checkLiveStatus, 15000); // Polling léger
    return () => clearInterval(interval);
  }, [checkLiveStatus]);

  // 2. LOGIQUE DE FLUX (WebRTC)
  const startStream = async (type) => {
    try {
      const constraints = { 
        video: type === 'video' ? { width: 1280, height: 720 } : false, 
        audio: true 
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      
      const res = await fetch("/api/live", {
        method: "POST",
        body: JSON.stringify({
          action: "start",
          admin: currentUser.email,
          type,
          title: `${type === 'video' ? 'Vidéo' : 'Audio'} Live de ${currentUser.penName || 'Admin'}`
        })
      });

      if (res.ok) {
        const data = await res.json();
        setLiveData(data);
        setIsLive(true);
        setStreamType(type);
        toast.success("Votre direct est lancé !");
      }
    } catch (err) {
      toast.error("Vérifiez vos permissions caméra/micro.");
    }
  };

  const stopLive = async () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    setIsLive(false);
    setStreamType(null);
    await fetch("/api/live", { method: "POST", body: JSON.stringify({ action: "stop", admin: currentUser.email }) });
    toast.info("Direct terminé.");
  };

  // 3. RÉACTIONS ÉPHÉMÈRES (Animation de vol)
  const sendReaction = (type, text = "") => {
    const id = Date.now();
    const newReaction = { id, type, text, x: Math.random() * 70 + 15 };
    setReactions(prev => [...prev, newReaction]);
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id));
    }, 4000);
    if (text) setComment("");
  };

  const handleShare = () => {
    const url = `${window.location.origin}/live?room=${liveData?.roomID}`;
    navigator.clipboard.writeText(url);
    toast.success("Lien de partage copié !");
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      {/* ÉCRAN PRINCIPAL DU LIVE */}
      <div className="relative aspect-video bg-slate-950 rounded-[3.5rem] overflow-hidden border-[12px] border-white shadow-2xl group">
        
        {isLive ? (
          streamType === 'video' ? (
            <video ref={videoRef} autoPlay playsInline muted={isAdmin} className="w-full h-full object-cover animate-in fade-in duration-700" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-teal-900 to-slate-950">
              <div className="relative">
                <div className="absolute inset-0 bg-teal-500 rounded-full animate-ping opacity-20" />
                <div className="relative bg-teal-500 p-12 rounded-full text-white shadow-3xl">
                  <Mic size={64} />
                </div>
              </div>
              <p className="text-teal-400 mt-8 font-black uppercase tracking-[0.3em] text-[10px]">Transmission Audio en cours</p>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-800">
             <Radio size={80} className={`${isAdmin ? "text-teal-600 animate-pulse" : "text-slate-100"}`} />
             <h2 className="mt-6 text-xl font-black italic tracking-tighter opacity-20 uppercase">
                {isAdmin ? "Studio Lisible" : "En attente du direct"}
             </h2>
          </div>
        )}

        {/* OVERLAY DES RÉACTIONS ÉPHÉMÈRES */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {reactions.map(r => (
            <div 
              key={r.id}
              className="absolute bottom-10 animate-live-rise flex flex-col items-center"
              style={{ left: `${r.x}%` }}
            >
              {r.type === 'heart' ? (
                <Heart className="text-rose-500 fill-rose-500 drop-shadow-lg" size={40} />
              ) : (
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 px-5 py-3 rounded-[1.5rem] shadow-2xl">
                  <p className="text-white text-[11px] font-black tracking-tight leading-none">{r.text}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* STATUS BADGE */}
        {isLive && (
          <div className="absolute top-8 left-8 flex items-center gap-3">
            <div className="bg-rose-600 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg animate-pulse">
              <span className="w-2 h-2 bg-white rounded-full" /> Direct
            </div>
            <div className="bg-black/40 backdrop-blur-md text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-white/10">
              <Users size={14} /> 1.2k
            </div>
          </div>
        )}
      </div>

      {/* BARRE DE CONTRÔLE / INTERACTION */}
      <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col md:flex-row items-center gap-6">
        
        {isAdmin ? (
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            {!isLive ? (
              <>
                <button onClick={() => startStream('video')} className="flex-1 md:flex-none bg-slate-950 text-white px-8 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-teal-600 transition-all shadow-xl">
                  <Video size={18} /> Lancer Vidéo
                </button>
                <button onClick={() => startStream('audio')} className="flex-1 md:flex-none bg-slate-100 text-slate-900 px-8 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-200 transition-all">
                  <Mic size={18} /> Lancer Audio
                </button>
              </>
            ) : (
              <>
                <button onClick={stopLive} className="bg-rose-600 text-white px-8 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-rose-700 transition-all shadow-lg">
                  <X size={18} /> Arrêter le live
                </button>
                <button onClick={() => setIsInviteOpen(true)} className="bg-teal-600 text-white p-5 rounded-[1.8rem] hover:bg-teal-700 transition-all shadow-lg">
                  <UserPlus size={20} />
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-4 w-full">
            <button 
              onClick={() => sendReaction('heart')}
              className="p-5 bg-rose-50 text-rose-600 rounded-[1.8rem] hover:scale-110 active:scale-95 transition-all shadow-sm"
            >
              <Heart size={24} fill="currentColor" />
            </button>
            <div className="relative flex-1">
              <input 
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && comment.trim() && sendReaction('comment', comment)}
                placeholder="Dire quelque chose de beau..."
                className="w-full bg-slate-50 border-2 border-transparent focus:border-teal-500 focus:bg-white rounded-[2rem] px-8 py-5 text-sm font-medium outline-none transition-all"
              />
              <button 
                onClick={() => comment.trim() && sendReaction('comment', comment)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-teal-600 hover:bg-teal-50 rounded-xl transition-all"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 border-l border-slate-100 pl-6 hidden md:flex">
          <button onClick={handleShare} className="p-5 bg-slate-50 text-slate-400 rounded-[1.8rem] hover:bg-slate-100 hover:text-slate-900 transition-all">
            <Share2 size={22} />
          </button>
        </div>
      </div>

      {/* MODAL D'INVITATION */}
      <InviteModal 
        isOpen={isInviteOpen} 
        onClose={() => setIsInviteOpen(false)} 
        adminEmail={currentUser?.email}
        liveData={liveData}
      />

      {/* ANIMATIONS CSS */}
      <style jsx global>{`
        @keyframes live-rise {
          0% { transform: translateY(0) scale(0.3); opacity: 0; }
          15% { opacity: 1; transform: translateY(-50px) scale(1.1); }
          80% { opacity: 0.8; }
          100% { transform: translateY(-600px) scale(1); opacity: 0; }
        }
        .animate-live-rise {
          animation: live-rise 4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
      `}</style>
    </div>
  );
}
