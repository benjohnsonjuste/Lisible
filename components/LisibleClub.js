"use client";
import React, { useState, useEffect, useRef } from "react";
import { Send, Radio, LogOut, Loader2, Heart, Share2 } from "lucide-react";
import Pusher from "pusher-js";
import { 
  LivepeerConfig, 
  createReactClient, 
  studioProvider, 
  Player, 
  Broadcast 
} from "@livepeer/react";
import { toast } from "sonner";

// 1. Client Livepeer
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
  const [tempMessages, setTempMessages] = useState([]); // Messages éphémères
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

  // --- RÉCUPÉRATION DU FLUX (Correction Image/Son) ---
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
        if (!isHost) setJoined(true); // Rejoint auto si le flux existe
      }
    } catch (e) {
      console.error("Erreur sync flux");
    }
  };

  useEffect(() => {
    if (roomId) {
      syncStream();
      // Polling pour les spectateurs si le live n'est pas encore lancé
      if (!isHost) {
        const interval = setInterval(syncStream, 10000);
        return () => clearInterval(interval);
      }
    }
  }, [roomId, isHost]);

  // --- PUSHER (Messages + Cœurs) ---
  useEffect(() => {
    if (!roomId) return;
    const pusher = new Pusher('1da55287e2911ceb01dd', { cluster: 'us2', forceTLS: true });
    const channel = pusher.subscribe(`chat-${roomId}`);
    
    channel.bind('new-message', (data) => {
      const id = Date.now();
      setTempMessages(prev => [...prev, { ...data, id }]);
      // Supprime le message après 6 secondes
      setTimeout(() => {
        setTempMessages(prev => prev.filter(m => m.id !== id));
      }, 6000);
    });

    channel.bind('new-heart', () => triggerLocalHeart());

    return () => { channel.unbind_all(); channel.unsubscribe(); };
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

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/lisible-club?room=${roomId}`;
    if (navigator.share) {
      navigator.share({ title: "Club Live", text: "Rejoins mon direct !", url: shareUrl });
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Lien copié !");
    }
  };

  const startLive = async () => {
    setLoading(true);
    await syncStream();
    const user = getUser();
    if (isHost) {
      await fetch('/api/create-notif', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'live',
          message: `🔴 ${user.penName || user.name || "Un auteur"} est en direct !`,
          link: `/lisible-club?room=${roomId}`,
          targetEmail: "all" 
        })
      });
    }
    setJoined(true);
    setLoading(false);
  };

  const handleSendChat = async () => {
    if (!inputMsg.trim()) return;
    const user = getUser();
    await fetch('/api/live/pusher-trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        channel: `chat-${roomId}`, 
        event: 'new-message', 
        data: { user: user.penName || user.name || "Anonyme", text: inputMsg } 
      })
    });
    setInputMsg("");
  };

  return (
    <div className="w-full h-[60vh] md:h-[70vh] bg-slate-950 rounded-[3rem] shadow-2xl overflow-hidden relative border border-white/5">
      
      {/* OVERLAY CŒURS */}
      <div className="absolute inset-0 pointer-events-none z-[60] overflow-hidden">
        {floatingHearts.map(heart => (
          <div key={heart.id} className="absolute bottom-0 text-rose-500 animate-float-heart opacity-0" style={{ left: `${heart.left}%` }}>
            <Heart fill="currentColor" size={28} />
          </div>
        ))}
      </div>

      {!joined ? (
        <div className="flex flex-col items-center justify-center h-full text-white p-6">
          <Radio size={64} className="text-teal-400 animate-pulse mb-8" />
          <button onClick={startLive} disabled={loading} className="bg-white text-black px-12 py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-teal-400 transition-all">
            {loading ? <Loader2 className="animate-spin" size={18} /> : (isHost ? "Ouvrir l'antenne" : "Vérification du direct...")}
          </button>
        </div>
      ) : (
        <div className="relative h-full w-full bg-black">
          {/* PLAYER VIDÉO / AUDIO */}
          <div className="absolute inset-0 z-0">
            {isHost ? (
              <Broadcast streamKey={streamData?.streamKey} objectFit="cover" />
            ) : (
              <Player playbackId={streamData?.playbackId} autoPlay muted={false} objectFit="cover" />
            )}
          </div>
          
          {/* HUD ACTIONS */}
          <div className="absolute top-6 left-6 right-6 z-50 flex justify-between items-start">
             <div className="bg-red-600 text-white px-3 py-1 rounded-lg flex items-center gap-2 animate-pulse shadow-lg font-black text-[9px] uppercase">
                Live
             </div>
             <div className="flex gap-2">
                <button onClick={handleShare} className="p-3 bg-black/40 backdrop-blur-md text-white rounded-2xl border border-white/10 hover:bg-teal-500 transition-all"><Share2 size={18} /></button>
                <button onClick={() => window.location.reload()} className="p-3 bg-black/40 backdrop-blur-md text-white rounded-2xl border border-white/10 hover:bg-rose-500 transition-all"><LogOut size={18} /></button>
             </div>
          </div>

          {/* MESSAGES ÉPHÉMÈRES (Animation coin gauche) */}
          <div className="absolute bottom-28 left-6 z-[70] space-y-2 pointer-events-none max-w-[250px]">
            {tempMessages.map((m) => (
              <div key={m.id} className="bg-black/40 backdrop-blur-xl p-3 rounded-2xl border border-white/10 animate-message-fade">
                <p className="text-teal-400 font-black text-[8px] uppercase tracking-tighter mb-0.5">{m.user}</p>
                <p className="text-white text-xs font-medium leading-tight">{m.text}</p>
              </div>
            ))}
          </div>

          {/* INPUT & CŒUR */}
          <div className="absolute bottom-6 left-6 right-6 flex gap-2 z-[80]">
            <div className="flex-grow flex bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl px-5 items-center">
              <input 
                 value={inputMsg} 
                 onChange={(e) => setInputMsg(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                 className="bg-transparent border-none outline-none text-white text-xs w-full py-4 placeholder:text-slate-500"
                 placeholder="Réagir en direct..."
              />
              <button onClick={handleSendChat} className="text-white p-2 hover:text-teal-400"><Send size={16}/></button>
            </div>
            <button onClick={sendHeart} className="p-4 bg-rose-500 text-white rounded-2xl shadow-lg hover:bg-rose-600 active:scale-90 transition-all">
              <Heart size={20} fill="currentColor" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
