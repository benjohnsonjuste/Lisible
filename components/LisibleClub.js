"use client";
import React, { useState, useEffect, useRef } from "react";
import { Heart, Send, Radio, LogOut, Loader2, Users } from "lucide-react";
import Pusher from "pusher-js";
import { 
  LivepeerConfig, 
  createReactClient, 
  studioProvider, 
  Player, 
  Broadcast 
} from "@livepeer/react";
import { toast } from "sonner";

const client = createReactClient({
  provider: studioProvider({ apiKey: "f15e0657-3f95-46f3-8b77-59f0f909162c" }), 
});

function ClubInterface({ roomId, isHost }) {
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState("");
  const [streamData, setStreamData] = useState(null);
  const [loading, setLoading] = useState(false);
  const mediaStreamRef = useRef(null);

  // 1. DÉCLENCHEMENT AUTOMATIQUE POUR LE SPECTATEUR
  useEffect(() => {
    if (!isHost && roomId) {
      connectToLive();
    }
  }, [roomId, isHost]);

  // SYNC CHAT (Pusher)
  useEffect(() => {
    if (!roomId) return;
    const pusher = new Pusher('1da55287e2911ceb01dd', { cluster: 'us2' });
    const channel = pusher.subscribe(`chat-${roomId}`);
    channel.bind('new-message', (data) => setMessages(prev => [...prev, data].slice(-10)));
    return () => pusher.unsubscribe(`chat-${roomId}`);
  }, [roomId]);

  // FONCTION DE CONNEXION (Améliorée avec retry)
  const connectToLive = async (retryCount = 0) => {
    setLoading(true);
    try {
      const res = await fetch("/api/live/create-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName: `Club-${roomId}` }),
      });
      const data = await res.json();
      
      if (!res.ok || !data.playbackId) throw new Error("Flux non prêt");

      setStreamData(data);
      setJoined(true);
    } catch (e) {
      // Si c'est un spectateur et que ça échoue, on réessaie 3 fois toutes les 5 secondes
      if (!isHost && retryCount < 3) {
        setTimeout(() => connectToLive(retryCount + 1), 5000);
      } else if (!isHost) {
        toast.error("Le live n'est pas encore actif. Réessaie dans un instant.");
      }
    } finally {
      setLoading(false);
    }
  };

  // LANCEMENT DU LIVE (Hôte)
  const startLive = async () => {
    setLoading(true);
    const user = JSON.parse(localStorage.getItem("lisible_user") || "{}");

    try {
      // ÉTAPE 1 : NOTIFICATION IMMÉDIATE (Avant même la création lourde)
      if (isHost) {
        fetch('/api/create-notif', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'live',
            message: `🔴 ${user.penName || user.name || "Un auteur"} est en LIVE ! Rejoins le Club.`,
            link: `/lisible-club?room=${roomId}`,
            targetEmail: null // Envoi global
          })
        });
      }

      // ÉTAPE 2 : CRÉATION DU FLUX LIVEPEER
      const res = await fetch("/api/live/create-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName: `Club-${roomId}` }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error();

      setStreamData(data);
      setJoined(true);
      toast.success(isHost ? "Tu es en direct !" : "Bienvenue au Club !");
    } catch (e) {
      toast.error("Erreur d'initialisation du direct.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendChat = async () => {
    if (!inputMsg.trim()) return;
    const user = JSON.parse(localStorage.getItem("lisible_user") || "{}");
    await fetch('/api/live/pusher-trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        channel: `chat-${roomId}`, 
        event: 'new-message', 
        data: { user: user.penName || "Anonyme", text: inputMsg } 
      })
    });
    setInputMsg("");
  };

  return (
    <div className="w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
      {!joined ? (
        <div className="flex flex-col items-center justify-center text-white p-6 text-center animate-in fade-in duration-500">
          <div className="relative mb-8">
             <Radio size={64} className="text-teal-400 animate-pulse" />
             <div className="absolute inset-0 bg-teal-400/20 blur-xl rounded-full"></div>
          </div>
          <h2 className="text-3xl font-black italic mb-2 tracking-tighter">LISIBLE CLUB</h2>
          <p className="text-slate-500 text-[10px] mb-8 uppercase tracking-[0.4em]">Connexion au salon {roomId}...</p>
          
          <button 
            onClick={isHost ? startLive : connectToLive} 
            disabled={loading}
            className="bg-white text-black px-12 py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-teal-400 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isHost ? "Ouvrir l'antenne" : "Rejoindre le direct")}
          </button>
        </div>
      ) : (
        <div className="relative h-full w-full bg-black">
          {/* PLAYER / BROADCAST */}
          <div className="absolute inset-0 z-0">
            {isHost ? (
              <Broadcast 
                streamKey={streamData?.streamKey} 
                onMediaStream={(s) => (mediaStreamRef.current = s)}
                objectFit="cover"
              />
            ) : (
              <Player 
                playbackId={streamData?.playbackId} 
                autoPlay 
                muted={false}
                objectFit="cover"
                showPipButton={false}
              />
            )}
          </div>
          
          {/* HEADER LIVE */}
          <div className="absolute top-6 left-6 right-6 z-50 flex justify-between items-start">
             <div className="bg-red-600 text-white px-3 py-1 rounded-lg flex items-center gap-2 animate-pulse">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="text-[10px] font-black uppercase tracking-widest">En direct</span>
             </div>
             <button 
                onClick={() => {
                  if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
                  window.location.reload(); // Reset propre
                }} 
                className="p-3 bg-black/40 backdrop-blur-md hover:bg-white hover:text-black text-white rounded-2xl transition-all"
              >
                <LogOut size={20} />
              </button>
          </div>

          {/* CHAT OVERLAY */}
          <div className="absolute bottom-28 left-6 right-6 z-40 space-y-3 pointer-events-none max-h-[40%] overflow-hidden flex flex-col justify-end">
            {messages.map((m, i) => (
              <div key={i} className="bg-black/40 backdrop-blur-lg p-3 rounded-2xl border border-white/10 self-start animate-in slide-in-from-bottom-2 duration-300">
                <p className="text-teal-400 font-black text-[9px] uppercase mb-0.5">{m.user}</p>
                <p className="text-white text-sm font-medium leading-tight">{m.text}</p>
              </div>
            ))}
          </div>

          {/* INPUT FIELD */}
          <div className="absolute bottom-8 left-6 right-6 flex gap-2 z-50">
            <div className="flex-grow flex bg-white/10 backdrop-blur-3xl border border-white/20 rounded-[1.5rem] px-5 items-center">
              <input 
                 value={inputMsg} 
                 onChange={(e) => setInputMsg(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                 className="bg-transparent border-none outline-none text-white text-sm w-full py-5 placeholder:text-slate-400"
                 placeholder="Écrire un message..."
              />
              <button onClick={handleSendChat} className="text-white p-2 hover:text-teal-400 transition-colors">
                <Send size={20}/>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
