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

// 1. Initialisation stable du client
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

  // Sync Chat & Likes via Pusher
  useEffect(() => {
    if (!roomId) return;
    const pusher = new Pusher('1da55287e2911ceb01dd', { cluster: 'us2' });
    const channel = pusher.subscribe(`chat-${roomId}`);
    
    channel.bind('new-message', (data) => setMessages(prev => [...prev, data].slice(-10)));
    channel.bind('new-like', () => setStats(s => ({ ...s, likes: s.likes + 1 })));
    
    return () => pusher.unsubscribe(`chat-${roomId}`);
  }, [roomId]);

  const startLive = async () => {
    setLoading(true);
    try {
      // Appel API pour créer/récupérer le flux
      const res = await fetch("/api/live/create-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName: `Club-${roomId}` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();

      // ENVOI DE LA NOTIFICATION AVEC LE LIEN PAR PARAMÈTRE URL
      if (isHost) {
        const user = JSON.parse(localStorage.getItem("lisible_user") || "{}");
        await fetch('/api/create-notif', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'live',
            message: `${user.penName || "Un auteur"} est en direct dans le Club !`,
            link: `/lisible-club?room=${roomId}` // Lien adapté à ta structure
          })
        });
      }

      setStreamData(data);
      setJoined(true);
      toast.success("Connexion réussie !");
    } catch (e) {
      toast.error("Le serveur vidéo ne répond pas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-slate-950">
      {!joined ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
          <div className="w-24 h-24 bg-teal-500/10 rounded-full flex items-center justify-center mb-6">
            <Radio size={48} className="text-teal-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black italic mb-2 tracking-tighter">LISIBLE CLUB</h2>
          <p className="text-slate-400 text-[10px] mb-8 uppercase tracking-[0.3em]">Salon : {roomId}</p>
          
          <button 
            onClick={startLive} 
            disabled={loading}
            className="bg-teal-600 px-12 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-teal-500 transition-all flex items-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : (isHost ? "Ouvrir l'antenne" : "Rejoindre le salon")}
          </button>
        </div>
      ) : (
        <div className="relative h-full w-full">
          {/* STREAMING ENGINE */}
          {isHost ? (
            <Broadcast 
              streamKey={streamData?.streamKey} 
              onMediaStream={(s) => (mediaStreamRef.current = s)} 
            />
          ) : (
            <Player playbackId={streamData?.playbackId} autoPlay />
          )}
          
          {/* OVERLAY UI */}
          <button 
            onClick={() => setJoined(false)} 
            className="absolute top-6 right-6 z-50 p-3 bg-white/10 backdrop-blur-md hover:bg-red-600 text-white rounded-2xl transition-all"
          >
            <LogOut size={20} />
          </button>

          {/* CHAT MESSAGES */}
          <div className="absolute bottom-28 left-6 right-6 z-40 space-y-2 pointer-events-none max-h-48 overflow-hidden flex flex-col justify-end">
            {messages.map((m, i) => (
              <div key={i} className="bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10 self-start animate-in slide-in-from-left-4">
                <p className="text-teal-400 font-black text-[9px] uppercase">{m.user}</p>
                <p className="text-white text-xs">{m.text}</p>
              </div>
            ))}
          </div>

          {/* INPUT AREA */}
          <div className="absolute bottom-8 left-6 right-6 flex gap-2 z-50">
            <input 
               value={inputMsg} 
               onChange={(e) => setInputMsg(e.target.value)}
               className="flex-grow bg-black/40 backdrop-blur-2xl border border-white/20 rounded-2xl px-5 text-white text-sm outline-none py-4"
               placeholder="Dire quelque chose..."
            />
            <button className="bg-teal-500 p-4 rounded-2xl text-white shadow-lg shadow-teal-500/20 active:scale-95 transition-all">
              <Send size={20}/>
            </button>
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
