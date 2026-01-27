"use client";
import React, { useState, useEffect, useRef } from "react";
import { Send, Radio, LogOut, Loader2 } from "lucide-react";
import Pusher from "pusher-js";
import { 
  LivepeerConfig, 
  createReactClient, 
  studioProvider, 
  Player, 
  Broadcast 
} from "@livepeer/react";
import { toast } from "sonner";

// 1. Client Livepeer configuré à l'extérieur pour la stabilité
const livepeerClient = createReactClient({
  provider: studioProvider({ apiKey: "f15e0657-3f95-46f3-8b77-59f0f909162c" }), 
});

// 2. COMPOSANT PRINCIPAL (WRAPPER)
export default function LisibleClub(props) {
  return (
    <LivepeerConfig client={livepeerClient}>
      <ClubInterface {...props} />
    </LivepeerConfig>
  );
}

// 3. INTERFACE RÉELLE
function ClubInterface({ roomId, isHost }) {
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState("");
  const [streamData, setStreamData] = useState(null);
  const [loading, setLoading] = useState(false);
  const mediaStreamRef = useRef(null);

  // Sécurité pour le rendu serveur (SSR)
  const getUser = () => {
    if (typeof window === 'undefined') return {};
    try {
      return JSON.parse(localStorage.getItem("lisible_user") || "{}");
    } catch (e) {
      return {};
    }
  };

  // Connexion automatique spectateur
  useEffect(() => {
    if (!isHost && roomId) {
      connectToLive();
    }
  }, [roomId, isHost]);

  // Synchronisation Chat Pusher
  useEffect(() => {
    if (!roomId) return;
    
    // Configuration Pusher
    const pusher = new Pusher('1da55287e2911ceb01dd', { 
      cluster: 'us2',
      forceTLS: true 
    });
    
    const channel = pusher.subscribe(`chat-${roomId}`);
    
    channel.bind('new-message', (data) => {
      setMessages(prev => [...prev, data].slice(-10));
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [roomId]);

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
      // Stratégie de retry pour les spectateurs si le host n'est pas encore prêt
      if (!isHost && retryCount < 5) {
        setTimeout(() => connectToLive(retryCount + 1), 5000);
      } else if (!isHost) {
        toast.error("Le live n'est pas encore actif.");
      }
    } finally {
      setLoading(false);
    }
  };

  const startLive = async () => {
    setLoading(true);
    const user = getUser();

    try {
      // 1. Initialisation du flux Livepeer
      const res = await fetch("/api/live/create-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName: `Club-${roomId}` }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error("Échec Livepeer");
      setStreamData(data);

      // 2. Notification via votre API synchronisée GitHub/Pusher
      if (isHost) {
        await fetch('/api/create-notif', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'live',
            message: `🔴 ${user.penName || user.name || "Un auteur"} a ouvert l'antenne !`,
            link: `/lisible-club?room=${roomId}`,
            targetEmail: "all" 
          })
        });
      }

      setJoined(true);
      toast.success("Antenne ouverte !");
    } catch (e) {
      console.error(e);
      toast.error("Erreur d'initialisation du direct.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendChat = async () => {
    if (!inputMsg.trim()) return;
    const user = getUser();
    try {
      const res = await fetch('/api/live/pusher-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          channel: `chat-${roomId}`, 
          event: 'new-message', 
          data: { 
            user: user.penName || user.name || "Anonyme", 
            text: inputMsg 
          } 
        })
      });
      if (res.ok) setInputMsg("");
    } catch (e) {
      toast.error("Échec de l'envoi");
    }
  };

  return (
    <div className="w-full h-[60vh] md:h-[70vh] bg-slate-950 rounded-[3rem] shadow-2xl overflow-hidden relative border border-white/5">
      {!joined ? (
        <div className="flex flex-col items-center justify-center h-full text-white p-6 text-center">
          <div className="relative mb-8">
             <Radio size={64} className="text-teal-400 animate-pulse" />
             <div className="absolute inset-0 bg-teal-400/20 blur-xl rounded-full"></div>
          </div>
          <h2 className="text-2xl font-black italic mb-2 tracking-tighter uppercase">Lisible Club</h2>
          <p className="text-slate-500 text-[10px] mb-8 uppercase tracking-[0.4em]">Studio {roomId}</p>
          
          <button 
            onClick={isHost ? startLive : connectToLive} 
            disabled={loading}
            className="bg-white text-black px-12 py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-teal-400 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (isHost ? "Ouvrir l'antenne" : "Rejoindre le salon")}
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
              />
            )}
          </div>
          
          {/* HUD : LIVE STATUS */}
          <div className="absolute top-6 left-6 right-6 z-50 flex justify-between items-start">
             <div className="bg-red-600 text-white px-3 py-1 rounded-lg flex items-center gap-2 animate-pulse shadow-lg">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                <span className="text-[9px] font-black uppercase tracking-widest">Live</span>
             </div>
             <button 
                onClick={() => window.location.reload()} 
                className="p-3 bg-black/40 backdrop-blur-md hover:bg-rose-500 text-white rounded-2xl transition-all border border-white/10"
              >
                <LogOut size={18} />
              </button>
          </div>

          {/* CHAT OVERLAY */}
          <div className="absolute bottom-24 left-6 right-6 z-40 space-y-2 pointer-events-none max-h-[180px] overflow-hidden flex flex-col justify-end">
            {messages.map((m, i) => (
              <div key={i} className="bg-black/30 backdrop-blur-md p-3 rounded-2xl border border-white/5 self-start animate-in slide-in-from-bottom-2">
                <p className="text-teal-400 font-black text-[8px] uppercase mb-0.5 tracking-tighter">{m.user}</p>
                <p className="text-white/90 text-xs font-medium">{m.text}</p>
              </div>
            ))}
          </div>

          {/* CHAT INPUT */}
          <div className="absolute bottom-6 left-6 right-6 flex gap-2 z-50">
            <div className="flex-grow flex bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[1.5rem] px-5 items-center">
              <input 
                 value={inputMsg} 
                 onChange={(e) => setInputMsg(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                 className="bg-transparent border-none outline-none text-white text-xs w-full py-4 placeholder:text-slate-500"
                 placeholder="Réagir en direct..."
              />
              <button onClick={handleSendChat} className="text-white p-2 hover:text-teal-400 transition-colors">
                <Send size={16}/>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
