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

// 1. On crée le client Livepeer à l'extérieur pour éviter de le recréer au refresh
const livepeerClient = createReactClient({
  provider: studioProvider({ apiKey: "TON_API_KEY_STUDIO" }), // Remplace par ta clé si nécessaire
});

// 2. On sépare le contenu du Club pour qu'il soit bien à l'intérieur du Provider
function ClubContent({ roomId, isHost }) {
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState("");
  const [stats, setStats] = useState({ likes: 0 });
  const [streamData, setStreamData] = useState(null);
  const [loading, setLoading] = useState(false);
  const mediaStreamRef = useRef(null);

  // Sync Chat & Likes
  useEffect(() => {
    const pusher = new Pusher('1da55287e2911ceb01dd', { cluster: 'us2' });
    const channel = pusher.subscribe(`chat-${roomId}`);
    
    channel.bind('new-message', (data) => setMessages(prev => [...prev, data].slice(-15)));
    channel.bind('new-like', () => setStats(s => ({ ...s, likes: s.likes + 1 })));
    
    return () => pusher.unsubscribe(`chat-${roomId}`);
  }, [roomId]);

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

      // Notification (déjà fonctionnelle chez toi)
      if (isHost) {
        const user = JSON.parse(localStorage.getItem("lisible_user") || "{}");
        await fetch('/api/create-notif', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'live',
            message: `${user.penName || user.name || "Un auteur"} a lancé un direct !`,
            link: `/club/${roomId}`
          })
        });
      }

      setStreamData(data);
      setJoined(true);
      toast.success(isHost ? "Antenne ouverte !" : "Bienvenue au Club !");
    } catch (error) {
      toast.error("Erreur serveur vidéo.");
    } finally {
      setLoading(false);
    }
  };

  const quitLive = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    setJoined(false);
    setStreamData(null);
  };

  return (
    <div className="relative w-full h-full bg-black">
      {!joined ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
           <Radio size={40} className="text-teal-400 animate-pulse mb-4" />
           <button 
             onClick={startLive} 
             disabled={loading}
             className="bg-teal-600 px-8 py-3 rounded-xl font-black text-white uppercase text-[10px]"
           >
             {loading ? <Loader2 className="animate-spin" /> : (isHost ? "Lancer le direct" : "Rejoindre")}
           </button>
        </div>
      ) : (
        <>
          {/* VIDEO ZONE */}
          <div className="absolute inset-0">
            {isHost ? (
              <Broadcast 
                streamKey={streamData?.streamKey} 
                onMediaStream={(s) => (mediaStreamRef.current = s)}
              />
            ) : (
              <Player playbackId={streamData?.playbackId} autoPlay muted={false} />
            )}
          </div>

          {/* UI OVERLAY */}
          <div className="absolute top-6 right-6 z-50">
            <button onClick={quitLive} className="p-3 bg-red-600 text-white rounded-2xl shadow-xl">
              <LogOut size={20} />
            </button>
          </div>

          <div className="absolute bottom-24 left-6 z-40 space-y-2 pointer-events-none">
            {messages.map((m, i) => (
              <div key={i} className="bg-black/50 backdrop-blur-md p-2 rounded-lg border border-white/10">
                <p className="text-teal-400 font-bold text-[10px]">{m.user}</p>
                <p className="text-white text-xs">{m.text}</p>
              </div>
            ))}
          </div>

          {/* INPUTS */}
          <div className="absolute bottom-6 left-6 right-6 flex gap-2 z-50">
            <input 
              value={inputMsg} 
              onChange={e => setInputMsg(e.target.value)}
              placeholder="Message..."
              className="flex-grow bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-4 text-white text-sm outline-none"
            />
            <button 
              onClick={async () => {
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
              }}
              className="p-4 bg-teal-600 rounded-2xl text-white"
            >
              <Send size={20} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// 3. LE WRAPPER INDISPENSABLE
export default function LisibleClub(props) {
  return (
    <LivepeerConfig client={livepeerClient}>
      <div className="max-w-4xl mx-auto h-[85vh] relative bg-black rounded-[3rem] overflow-hidden shadow-2xl border border-white/5">
        <ClubContent {...props} />
      </div>
    </LivepeerConfig>
  );
}
