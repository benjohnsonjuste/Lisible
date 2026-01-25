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
  const [stats, setStats] = useState({ likes: 0 });
  const [streamData, setStreamData] = useState(null);
  const [loading, setLoading] = useState(false);
  const mediaStreamRef = useRef(null);

  // 1. Déclenchement automatique pour les spectateurs
  useEffect(() => {
    if (!isHost && roomId) {
      console.log("Mode spectateur détecté, connexion automatique...");
      connectToLive();
    }
  }, [roomId, isHost]);

  // Sync Chat & Likes
  useEffect(() => {
    if (!roomId) return;
    const pusher = new Pusher('1da55287e2911ceb01dd', { cluster: 'us2' });
    const channel = pusher.subscribe(`chat-${roomId}`);
    channel.bind('new-message', (data) => setMessages(prev => [...prev, data].slice(-10)));
    channel.bind('new-like', () => setStats(s => ({ ...s, likes: s.likes + 1 })));
    return () => pusher.unsubscribe(`chat-${roomId}`);
  }, [roomId]);

  // Fonction partagée pour récupérer les données du flux
  const connectToLive = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/live/create-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName: `Club-${roomId}` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error("Flux introuvable");

      setStreamData(data);
      setJoined(true);
    } catch (e) {
      console.error(e);
      if (!isHost) toast.error("Le direct n'est pas encore accessible.");
    } finally {
      setLoading(false);
    }
  };

  const startLive = async () => {
    setLoading(true);
    try {
      // A. Création du flux
      const res = await fetch("/api/live/create-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName: `Club-${roomId}` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();

      // B. Notification (Uniquement si hôte)
      if (isHost) {
        const user = JSON.parse(localStorage.getItem("lisible_user") || "{}");
        await fetch('/api/create-notif', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: Date.now(),
            type: 'live',
            message: `${user.penName || user.name || "Un auteur"} est en direct dans le Club !`,
            link: `/lisible-club?room=${roomId}`,
            date: new Date().toISOString(),
            targetEmail: null
          })
        });
      }

      setStreamData(data);
      setJoined(true);
      toast.success(isHost ? "Antenne ouverte !" : "Bienvenue au Club !");
    } catch (e) {
      toast.error("Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendChat = async () => {
    if (!inputMsg.trim()) return;
    const user = JSON.parse(localStorage.getItem("lisible_user") || "{}");
    await fetch('/api/live/pusher-trigger', {
      method: 'POST',
      body: JSON.stringify({ 
        channel: `chat-${roomId}`, 
        event: 'new-message', 
        data: { user: user.penName || "Anonyme", text: inputMsg } 
      })
    });
    setInputMsg("");
  };

  return (
    <div className="w-full h-full bg-slate-950">
      {!joined ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
          <Radio size={48} className="text-teal-400 animate-pulse mb-6" />
          <h2 className="text-2xl font-black italic mb-2 uppercase">Lisible Club</h2>
          <p className="text-slate-400 text-[10px] mb-8 uppercase tracking-[0.3em]">Salon : {roomId}</p>
          
          <button 
            onClick={startLive} 
            disabled={loading}
            className="bg-teal-600 px-12 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-teal-500 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : (isHost ? "Ouvrir l'antenne" : "Entrer dans le salon")}
          </button>
        </div>
      ) : (
        <div className="relative h-full w-full">
          {isHost ? (
            <Broadcast streamKey={streamData?.streamKey} onMediaStream={(s) => (mediaStreamRef.current = s)} />
          ) : (
            <Player playbackId={streamData?.playbackId} autoPlay muted={false} />
          )}
          
          <button 
            onClick={() => {
              if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
              setJoined(false);
            }} 
            className="absolute top-6 right-6 z-50 p-3 bg-white/10 backdrop-blur-md hover:bg-red-600 text-white rounded-2xl"
          >
            <LogOut size={20} />
          </button>

          {/* CHAT */}
          <div className="absolute bottom-28 left-6 right-6 z-40 space-y-2 pointer-events-none max-h-48 overflow-hidden flex flex-col justify-end">
            {messages.map((m, i) => (
              <div key={i} className="bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/5 self-start animate-in slide-in-from-left-4">
                <p className="text-teal-400 font-black text-[9px] uppercase">{m.user}</p>
                <p className="text-white text-xs">{m.text}</p>
              </div>
            ))}
          </div>

          <div className="absolute bottom-8 left-6 right-6 flex gap-2 z-50">
            <div className="flex-grow flex bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl px-5 items-center">
              <input 
                 value={inputMsg} 
                 onChange={(e) => setInputMsg(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                 className="bg-transparent border-none outline-none text-white text-sm w-full py-4"
                 placeholder="Dire quelque chose..."
              />
              <button onClick={handleSendChat} className="text-teal-400 p-2 hover:scale-110 transition-transform">
                <Send size={20}/>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LisibleClub(props) {
  return (
    <LivepeerConfig client={client}>
      <div className="max-w-4xl mx-auto h-[80vh] relative bg-black rounded-[3rem] overflow-hidden shadow-2xl border border-white/5">
        <ClubInterface {...props} />
      </div>
    </LivepeerConfig>
  );
}
