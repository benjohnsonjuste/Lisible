"use client";
import React, { useState, useEffect } from "react";
import { Send, Radio, LogOut, Loader2, Heart, Share2, Video, Mic } from "lucide-react";
import Pusher from "pusher-js";
import { 
  LivepeerConfig, 
  createReactClient, 
  studioProvider, 
  Player, 
  Broadcast 
} from "@livepeer/react";
import { toast } from "sonner";

const livepeerClient = createReactClient({
  provider: studioProvider({ apiKey: "f15e0657-3f95-46f3-8b77-59f0f909162c" }), 
});

export default function LisibleClub(props) {
  return (
    <LivepeerConfig client={livepeerClient}>
      <ClubInterface {...props} />
    </LivepeerConfig>
  );
}

function ClubInterface({ roomId, isHost }) {
  const [joined, setJoined] = useState(false);
  const [tempMessages, setTempMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState("");
  const [streamData, setStreamData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState([]); 

  const getUser = () => {
    if (typeof window === 'undefined') return {};
    try {
      return JSON.parse(localStorage.getItem("lisible_user") || "{}");
    } catch (e) { return {}; }
  };

  const syncStream = async () => {
    try {
      const res = await fetch("/api/live/create-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName: `Club-${roomId}` }),
      });
      const data = await res.json();
      if (data.playbackId) {
        setStreamData(data);
        // Les spectateurs rejoignent auto si le flux est actif
        if (!isHost && data.isActive) setJoined(true); 
      }
      return data;
    } catch (e) {
      console.error("Erreur sync flux");
      return null;
    }
  };

  useEffect(() => {
    if (roomId) {
      syncStream();
      if (!isHost) {
        const interval = setInterval(syncStream, 10000);
        return () => clearInterval(interval);
      }
    }
  }, [roomId, isHost]);

  useEffect(() => {
    if (!roomId) return;
    const pusher = new Pusher('1da55287e2911ceb01dd', { cluster: 'us2', forceTLS: true });
    const channel = pusher.subscribe(`chat-${roomId}`);
    
    channel.bind('new-message', (data) => {
      console.log("Nouveau message reçu:", data); // Debug
      const id = Date.now() + Math.random();
      setTempMessages(prev => [...prev, { ...data, id }]);
      setTimeout(() => {
        setTempMessages(prev => prev.filter(m => m.id !== id));
      }, 8000); // Un peu plus long pour laisser le temps de lire
    });

    channel.bind('new-heart', () => triggerLocalHeart());

    return () => { 
      channel.unbind_all(); 
      pusher.unsubscribe(`chat-${roomId}`); 
    };
  }, [roomId]);

  const triggerLocalHeart = () => {
    const id = Date.now() + Math.random();
    setFloatingHearts(prev => [...prev, { id, left: Math.random() * 80 + 10 }]);
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== id));
    }, 3000);
  };

  const sendHeart = async () => {
    triggerLocalHeart();
    await fetch('/api/live/pusher-trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel: `chat-${roomId}`, event: 'new-heart', data: {} })
    });
  };

  const handleSendChat = async () => {
    if (!inputMsg.trim()) return;
    const user = getUser();
    const messageData = { 
      user: user.penName || user.name || "Anonyme", 
      text: inputMsg 
    };

    try {
      await fetch('/api/live/pusher-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          channel: `chat-${roomId}`, 
          event: 'new-message', 
          data: messageData 
        })
      });
      setInputMsg("");
    } catch (e) {
      toast.error("Erreur d'envoi du message");
    }
  };

  const startLive = async () => {
    setLoading(true);
    const data = await syncStream();
    const user = getUser();

    if (isHost && data) {
      try {
        await fetch('/api/create-notif', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'live',
            message: `🔴 ${user.penName || user.name || "Un auteur"} est en direct sur le Club !`,
            link: `/lisible-club?room=${roomId}`,
            targetEmail: "all" 
          })
        });
      } catch (err) { console.error(err); }
    }
    setJoined(true);
    setLoading(false);
  };

  return (
    <div className="w-full h-[60vh] md:h-[75vh] bg-slate-950 rounded-[3rem] shadow-2xl overflow-hidden relative border border-white/5">
      
      {/* OVERLAY CŒURS */}
      <div className="absolute inset-0 pointer-events-none z-[100] overflow-hidden">
        {floatingHearts.map(heart => (
          <div key={heart.id} className="absolute bottom-0 text-rose-500 animate-float-heart" style={{ left: `${heart.left}%` }}>
            <Heart fill="currentColor" size={32} />
          </div>
        ))}
      </div>

      {!joined ? (
        <div className="flex flex-col items-center justify-center h-full text-white p-6 bg-gradient-to-b from-slate-900 to-black">
          <Radio size={80} className="text-teal-400 animate-pulse mb-8" />
          <button 
            onClick={startLive} 
            disabled={loading} 
            className="btn-lisible px-12 py-5 shadow-2xl shadow-teal-500/20"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isHost ? "Ouvrir l'antenne" : "Entrer dans le salon")}
          </button>
        </div>
      ) : (
        <div className="relative h-full w-full bg-black">
          
          {/* PLAYER VIDÉO / BROADCAST - Correction: Activation vidéo et audio */}
          <div className="absolute inset-0 z-0">
            {isHost ? (
              <Broadcast 
                streamKey={streamData?.streamKey} 
                video={true} 
                audio={true} 
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
          
          {/* HUD ACTIONS */}
          <div className="absolute top-6 left-6 right-6 z-[110] flex justify-between items-start">
             <div className="bg-rose-600 text-white px-4 py-1.5 rounded-full flex items-center gap-2 shadow-xl font-black text-[10px] uppercase tracking-widest pulse-live">
                <span className="w-2 h-2 bg-white rounded-full"></span> Direct
             </div>
             <div className="flex gap-2">
                <button onClick={() => window.location.reload()} className="p-4 bg-black/40 backdrop-blur-md text-white rounded-2xl border border-white/10 hover:bg-rose-500 transition-all">
                  <LogOut size={18} />
                </button>
             </div>
          </div>

          {/* MESSAGES ÉPHÉMÈRES - Augmentation du z-index pour visibilité */}
          <div className="absolute bottom-32 left-6 z-[120] space-y-3 pointer-events-none max-w-[280px]">
            {tempMessages.map((m) => (
              <div key={m.id} className="bg-black/60 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl animate-message-fade pointer-events-auto">
                <p className="text-teal-400 font-black text-[9px] uppercase tracking-widest mb-1">{m.user}</p>
                <p className="text-white text-sm font-bold leading-snug">{m.text}</p>
              </div>
            ))}
          </div>

          {/* BARRE D'INTERACTION - Haute priorité z-index */}
          <div className="absolute bottom-8 left-6 right-6 flex gap-3 z-[130]">
            <div className="flex-grow flex bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[2rem] px-6 items-center shadow-2xl">
              <input 
                 value={inputMsg} 
                 onChange={(e) => setInputMsg(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                 className="bg-transparent border-none outline-none text-white text-sm w-full py-5 placeholder:text-slate-400 font-bold"
                 placeholder="Réagir au direct..."
              />
              <button onClick={handleSendChat} className="text-teal-400 p-2 hover:scale-110 transition-transform">
                <Send size={20}/>
              </button>
            </div>
            <button 
              onClick={sendHeart} 
              className="p-5 bg-rose-500 text-white rounded-[2rem] shadow-xl hover:bg-rose-600 active:scale-90 transition-all"
            >
              <Heart size={24} fill="currentColor" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
