"use client";
import React, { useState, useEffect } from "react";
import { Heart, Send, Users, Radio, X, StopCircle, Loader2 } from "lucide-react";
import Pusher from "pusher-js";
import { Player, Broadcast } from "@livepeer/react"; // Les composants magiques de Livepeer

export default function LisibleClub({ roomId, isHost = false }) {
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState("");
  const [stats, setStats] = useState({ likes: 0 });
  const [streamData, setStreamData] = useState(null); // Contiendra playbackId et streamKey

  // --- 1. INITIALISATION PUSHER (Chat & Likes) ---
  useEffect(() => {
    const pusher = new Pusher('1da55287e2911ceb01dd', { cluster: 'us2' });
    const channel = pusher.subscribe(`chat-${roomId}`);
    channel.bind('new-message', (data) => setMessages(prev => [...prev, data].slice(-15)));
    channel.bind('new-like', () => setStats(s => ({ ...s, likes: s.likes + 1 })));
    return () => pusher.unsubscribe(`chat-${roomId}`);
  }, [roomId]);

  // --- 2. LANCEMENT DU LIVE (Appel à ton API Livepeer) ---
  const startLive = async () => {
    try {
      // On demande à ton API de créer un flux sur Livepeer
      const res = await fetch("/api/live/create-stream", {
        method: "POST",
        body: JSON.stringify({ roomName: `Club-${roomId}` }),
      });
      const data = await res.json();
      setStreamData(data); // On récupère streamKey (pour diffuser) et playbackId (pour voir)
      setJoined(true);
    } catch (error) {
      console.error("Erreur de création de flux", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[85vh] relative bg-black rounded-[3rem] overflow-hidden shadow-2xl border border-white/5">
      
      {!joined ? (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900">
          <Radio size={48} className="text-teal-400 animate-pulse mb-6" />
          <h2 className="text-white font-black mb-6">LISIBLE CLUB</h2>
          <button onClick={startLive} className="bg-teal-600 px-10 py-4 rounded-2xl font-black uppercase text-[10px] text-white tracking-widest">
            {isHost ? "Ouvrir mon antenne" : "Entrer dans le Club"}
          </button>
        </div>
      ) : (
        <>
          {/* --- 3. ZONE VIDÉO RÉELLE --- */}
          <div className="absolute inset-0 bg-black">
            {isHost ? (
              /* L'HÔTE DIFFUSE (Broadcaster) */
              <Broadcast 
                streamKey={streamData?.streamKey}
                aspectRatio="16to9"
              />
            ) : (
              /* LE SPECTATEUR REGARDE (Player) */
              <Player 
                playbackId={streamData?.playbackId}
                autoPlay
                muted
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 pointer-events-none" />
          </div>

          {/* --- 4. INTERFACE OVERLAY (Pusher) --- */}
          <div className="absolute top-8 left-8 flex gap-2 z-10">
            <div className="bg-red-600 px-4 py-1.5 rounded-full text-[10px] font-black text-white flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"/> DIRECT
            </div>
          </div>

          {/* Chat style Instagram */}
          <div className="absolute bottom-32 left-6 w-72 flex flex-col gap-2 z-10">
            {messages.map((m, i) => (
              <div key={i} className="bg-black/30 backdrop-blur-md p-3 rounded-2xl border border-white/10 self-start animate-in slide-in-from-bottom-2">
                <p className="text-teal-400 font-black text-[9px] uppercase">{m.user}</p>
                <p className="text-white text-xs">{m.text}</p>
              </div>
            ))}
          </div>

          {/* Barre d'action */}
          <div className="absolute bottom-8 left-6 right-6 flex items-center gap-3 z-10">
            <input 
              value={inputMsg} 
              onChange={e => setInputMsg(e.target.value)}
              className="flex-grow bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none"
              placeholder="Dire quelque chose..."
            />
            <button 
              onClick={async () => {
                await fetch('/api/live/pusher-trigger', {
                  method: 'POST',
                  body: JSON.stringify({ channel: `chat-${roomId}`, event: 'new-like', data: {} })
                });
              }}
              className="p-5 bg-white/10 backdrop-blur-md rounded-2xl text-white border border-white/10 active:scale-90 transition-all"
            >
              <Heart size={22} className={stats.likes > 0 ? "fill-red-500 text-red-500" : ""} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
