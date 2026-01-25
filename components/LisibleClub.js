"use client";
import React, { useEffect, useState, useRef } from "react";
import { 
  Mic, Video, Heart, Send, Users, X, 
  Loader2, StopCircle, Radio, Share2 
} from "lucide-react"; 
import { toast } from "sonner";
import Pusher from "pusher-js";

export default function LisibleClub({ roomId, mode = "video", isHost = false }) {
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState("");
  const [stats, setStats] = useState({ viewers: 0, likes: 0 });
  const [user, setUser] = useState(null);
  const [isEnding, setIsEnding] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState([]);

  const pusherRef = useRef(null);

  // Initialisation utilisateur et Pusher
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("lisible_user");
      if (stored) setUser(JSON.parse(stored));

      // Initialisation Pusher (Remplace avec TA clé et TON cluster)
      const pusher = new Pusher('1da55287e2911ceb01dd', { cluster: 'us2' });
      pusherRef.current = pusher;

      const channel = pusher.subscribe(`chat-${roomId}`);

      // Écouter les nouveaux messages
      channel.bind('new-message', (data) => {
        setMessages(prev => [...prev, data].slice(-20));
      });

      // Écouter les nouveaux likes
      channel.bind('new-like', () => {
        setStats(prev => ({ ...prev, likes: prev.likes + 1 }));
        addFloatingHeart();
      });

      return () => {
        pusher.unsubscribe(`chat-${roomId}`);
      };
    }
  }, [roomId]);

  // Fonction pour l'animation des cœurs
  const addFloatingHeart = () => {
    const id = Date.now();
    setFloatingHearts(prev => [...prev, id]);
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h !== id));
    }, 1000);
  };

  // Déclencheur Pusher via ton API
  const triggerPusher = async (event, data) => {
    try {
      await fetch('/api/live/pusher-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: `chat-${roomId}`, event, data })
      });
    } catch (e) {
      console.error("Erreur Trigger:", e);
    }
  };

  const startLive = async () => {
    try {
      setJoined(true);
      if (isHost) {
        toast.info("Lancement du direct...");
        
        // Mise à jour GitHub
        await fetch('/api/live/update-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isLive: true, roomId, host: user?.penName || "Auteur", mode })
        });

        // Notification OneSignal
        await fetch('/api/notifications/broadcast-live', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authorName: user?.penName || "Auteur", mode, roomId })
        });

        toast.success("En direct !");
      }
    } catch (error) {
      toast.error("Erreur de lancement.");
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const msg = { 
      id: Date.now(), 
      user: user?.penName || user?.name || "Anonyme", 
      text: inputMsg 
    };

    await triggerPusher('new-message', msg);
    setInputMsg("");
  };

  const handleLike = async () => {
    await triggerPusher('new-like', {});
  };

  return (
    <div className="max-w-4xl mx-auto h-[85vh] relative bg-slate-950 rounded-[3rem] overflow-hidden shadow-2xl border border-white/5">
      
      {!joined ? (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
          <Radio size={40} className="text-teal-400 animate-pulse mb-6" />
          <h2 className="text-3xl font-black mb-4 italic tracking-tighter">Lisible Club</h2>
          <button 
            onClick={startLive} 
            className="bg-teal-600 text-white px-12 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-teal-500 transition-all shadow-xl shadow-teal-900/20"
          >
            {isHost ? "Lancer mon Live" : "Rejoindre le Club"}
          </button>
        </div>
      ) : (
        <>
          {/* Simulation Vidéo/Audio */}
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            {mode === "video" ? (
              <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                 <p className="text-white/20 italic font-black uppercase tracking-widest text-[10px]">Direct Vidéo Actif</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 animate-pulse">
                <Mic className="text-teal-500" size={48} />
                <p className="text-teal-500 font-black tracking-widest text-[10px] uppercase">Podcast en cours</p>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 pointer-events-none" />
          </div>

          {/* Header */}
          <div className="absolute top-8 left-8 right-8 flex justify-between items-start z-10">
            <div className="flex gap-2">
              <div className="bg-red-600 px-4 py-1.5 rounded-full text-[10px] font-black text-white flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"/> DIRECT
              </div>
              <div className="bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full text-white text-[10px] font-black flex items-center gap-2 border border-white/10">
                <Users size={12}/> {stats.viewers}
              </div>
            </div>
            <button onClick={() => window.location.href='/bibliotheque'} className="p-2.5 bg-white/10 backdrop-blur-md rounded-full text-white border border-white/10"><X size={20}/></button>
          </div>

          {/* Chat Ephémère */}
          <div className="absolute bottom-32 left-6 w-72 flex flex-col gap-2 z-10 max-h-64 overflow-hidden pointer-events-none">
            {messages.map((m) => (
              <div key={m.id} className="bg-black/30 backdrop-blur-md p-3 rounded-2xl border border-white/10 self-start animate-in slide-in-from-left-4 duration-500">
                <p className="text-teal-400 font-black text-[9px] uppercase tracking-widest mb-1">{m.user}</p>
                <p className="text-white text-xs font-medium leading-tight">{m.text}</p>
              </div>
            ))}
          </div>

          {/* Barre d'action avec Cœurs */}
          <div className="absolute bottom-8 left-6 right-6 flex items-center gap-3 z-10">
            <form onSubmit={sendMessage} className="flex-grow flex items-center bg-white/10 backdrop-blur-2xl border border-white/10 rounded-[1.5rem] px-5 py-4">
              <input 
                value={inputMsg} 
                onChange={e => setInputMsg(e.target.value)}
                placeholder="Commenter..." 
                className="bg-transparent border-none outline-none text-white text-sm w-full"
              />
              <button type="submit" className="text-teal-400"><Send size={20}/></button>
            </form>
            
            <div className="relative">
              {floatingHearts.map(id => (
                <Heart key={id} size={24} className="absolute -top-12 left-1/2 -translate-x-1/2 text-red-500 fill-red-500 heart-animation" />
              ))}
              <button onClick={handleLike} className="p-5 bg-white/10 backdrop-blur-2xl rounded-[1.5rem] text-white border border-white/10 active:scale-90 transition-all">
                <Heart size={22} className={stats.likes > 0 ? "fill-red-500 text-red-500" : ""} />
              </button>
            </div>
          </div>
        </>
      )}
      <style jsx>{`
        @keyframes floatUp {
          0% { transform: translate(-50%, 0) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -100px) scale(1.5); opacity: 0; }
        }
        .heart-animation { animation: floatUp 1s ease-out forwards; }
      `}</style>
    </div>
  );
}
