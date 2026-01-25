"use client";
import React, { useState, useEffect } from "react";
import { Heart, Send, Radio, X, Loader2, Users } from "lucide-react";
import Pusher from "pusher-js";
import { Player } from "@livepeer/react";
import { toast } from "sonner";

export default function LisibleClub({ roomId, isHost = false }) {
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState("");
  const [stats, setStats] = useState({ likes: 0 });
  const [streamData, setStreamData] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- LOGIQUE PUSHER (Chat & Likes) ---
  useEffect(() => {
    const pusher = new Pusher('1da55287e2911ceb01dd', { cluster: 'us2' });
    const channel = pusher.subscribe(`chat-${roomId}`);
    
    channel.bind('new-message', (data) => setMessages(prev => [...prev, data].slice(-15)));
    channel.bind('new-like', () => setStats(s => ({ ...s, likes: s.likes + 1 })));
    
    return () => pusher.unsubscribe(`chat-${roomId}`);
  }, [roomId]);

  // --- LANCEMENT DU FLUX VIDÉO ---
  const startLive = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/live/create-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName: `Club-${roomId}` }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erreur réseau");

      setStreamData(data);
      setJoined(true);
      toast.success(isHost ? "Diffusion activée !" : "Bienvenue dans le Club !");
    } catch (error) {
      console.error("Erreur lancement Live:", error);
      toast.error(`Erreur : ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[85vh] relative bg-black rounded-[3rem] overflow-hidden shadow-2xl border border-white/5">
      
      {!joined ? (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 text-white p-6">
          <div className="w-20 h-20 bg-teal-500/10 rounded-full flex items-center justify-center mb-6">
            <Radio size={40} className="text-teal-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black italic mb-2">Lisible Club</h2>
          <p className="text-slate-400 text-[10px] mb-8 uppercase tracking-[0.2em]">Salon : {roomId}</p>
          
          <button 
            onClick={startLive} 
            disabled={loading}
            className="bg-teal-600 px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-teal-500 transition-all flex items-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : (isHost ? "Lancer le direct" : "Rejoindre")}
          </button>
        </div>
      ) : (
        <>
          {/* ZONE VIDÉO (LIVEPEER) */}
          <div className="absolute inset-0 bg-black">
            {isHost ? (
              /* Vue Auteur : Retour Caméra Local */
              <video 
                ref={(el) => { 
                  if (el && !el.srcObject) {
                    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                      .then(s => { el.srcObject = s; })
                      .catch(() => toast.error("Accès caméra refusé"));
                  }
                }}
                autoPlay muted playsInline className="w-full h-full object-cover"
              />
            ) : (
              /* Vue Spectateur : Player Livepeer */
              <div className="w-full h-full bg-slate-900">
                {streamData?.playbackId ? (
                  <Player
                    playbackId={streamData.playbackId}
                    autoPlay
                    muted={false}
                    aspectRatio="16to9"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-white/20 text-[10px] font-black uppercase tracking-widest">
                    Connexion au flux...
                  </div>
                )}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80 pointer-events-none" />
          </div>

          {/* OVERLAY UI */}
          <div className="absolute top-8 left-8 flex items-center gap-3 z-20">
            <div className="bg-red-600 px-4 py-1.5 rounded-full text-[10px] font-black text-white flex items-center gap-2 shadow-lg shadow-red-900/20">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"/> DIRECT
            </div>
            <div className="bg-black/30 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full text-white text-[10px] font-black flex items-center gap-2">
              <Users size={12}/> {stats.likes > 5 ? "Live populaire" : "Club Privé"}
            </div>
          </div>

          {/* CHAT OVERLAY */}
          <div className="absolute bottom-32 left-6 w-72 flex flex-col gap-2 z-10 pointer-events-none">
            {messages.map((m, i) => (
              <div key={i} className="bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/5 self-start animate-in slide-in-from-left-4 duration-500">
                <p className="text-teal-400 font-black text-[9px] uppercase tracking-tighter">{m.user}</p>
                <p className="text-white text-xs font-medium leading-tight">{m.text}</p>
              </div>
            ))}
          </div>

          {/* BARRE D'ACTION */}
          <div className="absolute bottom-8 left-6 right-6 flex items-center gap-3 z-20">
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                if(!inputMsg.trim()) return;
                const user = JSON.parse(localStorage.getItem("lisible_user") || "{}");
                await fetch('/api/live/pusher-trigger', {
                  method: 'POST',
                  body: JSON.stringify({ 
                    channel: `chat-${roomId}`, 
                    event: 'new-message', 
                    data: { user: user.penName || user.name || "Anonyme", text: inputMsg } 
                  })
                });
                setInputMsg("");
              }}
              className="flex-grow flex bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl px-5 py-4"
            >
              <input 
                value={inputMsg} 
                onChange={e => setInputMsg(e.target.value)}
                className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-white/30"
                placeholder="Dire quelque chose..."
              />
              <button type="submit" className="text-teal-400 p-1 hover:scale-110 transition-transform"><Send size={18}/></button>
            </form>
            
            <button 
              onClick={async () => {
                await fetch('/api/live/pusher-trigger', {
                  method: 'POST',
                  body: JSON.stringify({ channel: `chat-${roomId}`, event: 'new-like', data: {} })
                });
              }}
              className="p-5 bg-white/10 backdrop-blur-2xl rounded-3xl text-white border border-white/10 active:scale-90 transition-all shadow-xl"
            >
              <Heart size={22} className={stats.likes > 0 ? "fill-red-500 text-red-500" : ""} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
