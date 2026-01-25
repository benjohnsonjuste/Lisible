"use client";
import React, { useEffect, useState, useRef } from "react";
import { Mic, Video, VideoOff, MicOff, Heart, Send, Users, X, Loader2, StopCircle } from "lucide-react";
import { toast } from "sonner";

export default function LisibleClub({ roomId, mode = "video", isHost = false }) {
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState("");
  const [stats, setStats] = useState({ viewers: 0, likes: 0 });
  const [user, setUser] = useState(null);
  const [isEnding, setIsEnding] = useState(false);

  useEffect(() => {
    const loggedUser = JSON.parse(localStorage.getItem("lisible_user"));
    setUser(loggedUser);
  }, []);

  // Lancer le Live
  const startLive = async () => {
    try {
      setJoined(true);
      if (isHost) {
        toast.info("Initialisation du direct...");

        // 1. Mettre à jour l'état Global sur GitHub pour allumer le "Point Rouge"
        await fetch('/api/live/update-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isLive: true,
            roomId: roomId,
            host: user?.penName || user?.name || "Un auteur",
            mode: mode
          })
        });

        // 2. Envoyer la notification Push OneSignal
        await fetch('/api/notifications/broadcast-live', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            authorName: user?.penName || user?.name || "Un auteur",
            mode: mode,
            roomId: roomId
          })
        });

        toast.success("Vous êtes en direct ! Toute la communauté a été alertée.");
      }
    } catch (error) {
      toast.error("Erreur lors du lancement du live.");
      console.error(error);
    }
  };

  // Arrêter le Live
  const endLive = async () => {
    if (!confirm("Voulez-vous vraiment couper le direct ?")) return;
    setIsEnding(true);
    try {
      await fetch('/api/live/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLive: false })
      });
      toast.success("Live terminé.");
      window.location.href = "/bibliotheque";
    } catch (e) {
      toast.error("Erreur lors de la fermeture.");
    } finally {
      setIsEnding(false);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    const msg = { 
      id: Date.now(), 
      user: user?.penName || user?.name || "Anonyme", 
      text: inputMsg 
    };
    setMessages(prev => [...prev, msg].slice(-20));
    setInputMsg("");
  };

  return (
    <div className="max-w-4xl mx-auto h-[85vh] relative bg-slate-950 rounded-[3rem] overflow-hidden shadow-2xl border border-white/5">
      
      {!joined ? (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
          <div className="w-20 h-20 bg-teal-500/20 rounded-3xl flex items-center justify-center mb-6 border border-teal-500/30">
            <Radio size={40} className="text-teal-400 animate-pulse" />
          </div>
          <h2 className="text-3xl font-black mb-4 italic tracking-tighter">Lisible Club</h2>
          <p className="text-slate-400 mb-8 max-w-xs text-sm italic">
            {isHost ? "Prêt à prendre la parole devant la communauté ?" : "Une session est peut-être en cours, rejoignez-la !"}
          </p>
          <button 
            onClick={startLive} 
            className="bg-teal-600 text-white px-12 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-teal-500 transition-all shadow-xl shadow-teal-900/20"
          >
            {isHost ? "Lancer mon Live" : "Rejoindre maintenant"}
          </button>
        </div>
      ) : (
        <>
          {/* Flux Vidéo/Audio */}
          <div className="absolute inset-0 flex items-center justify-center">
            {mode === "video" ? (
              <div className="w-full h-full bg-slate-800 flex items-center justify-center relative">
                 <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
                 <p className="text-white/20 italic font-black uppercase tracking-widest text-xs">Flux vidéo en direct...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6">
                <div className="w-32 h-32 bg-teal-500/10 rounded-full flex items-center justify-center border-2 border-teal-500/30 animate-pulse">
                  <Mic className="text-teal-500" size={48} />
                </div>
                <p className="text-teal-500 font-black tracking-widest text-[10px] uppercase">Podcast en cours</p>
              </div>
            )}
          </div>

          {/* Header Stats & Controls */}
          <div className="absolute top-8 left-8 right-8 flex justify-between items-start z-10">
            <div className="flex gap-2">
              <div className="bg-red-600 px-4 py-1.5 rounded-full text-[10px] font-black text-white flex items-center gap-2 shadow-lg shadow-red-900/20">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"/> DIRECT
              </div>
              <div className="bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full text-white text-[10px] font-black flex items-center gap-2 border border-white/10">
                <Users size={12}/> {stats.viewers}
              </div>
            </div>
            
            <div className="flex gap-2">
              {isHost && (
                <button 
                  onClick={endLive}
                  disabled={isEnding}
                  className="p-2.5 bg-red-500/20 hover:bg-red-500 backdrop-blur-md rounded-full text-white transition-all border border-red-500/50"
                  title="Arrêter le live"
                >
                  {isEnding ? <Loader2 size={20} className="animate-spin" /> : <StopCircle size={20}/>}
                </button>
              )}
              <button onClick={() => window.location.href='/bibliotheque'} className="p-2.5 bg-white/10 backdrop-blur-md rounded-full text-white border border-white/10 hover:bg-white/20 transition-all"><X size={20}/></button>
            </div>
          </div>

          {/* Chat style Instagram (bas gauche) */}
          <div className="absolute bottom-32 left-6 w-72 flex flex-col gap-2 z-10 max-h-64 overflow-hidden pointer-events-none">
            {messages.map((m) => (
              <div key={m.id} className="bg-black/30 backdrop-blur-md p-3 rounded-2xl border border-white/10 self-start animate-in slide-in-from-left-4 duration-500">
                <p className="text-teal-400 font-black text-[9px] uppercase tracking-widest mb-1">{m.user}</p>
                <p className="text-white text-xs font-medium leading-tight">{m.text}</p>
              </div>
            ))}
          </div>

          {/* Barre d'action */}
          <div className="absolute bottom-8 left-6 right-6 flex items-center gap-3 z-10">
            <form onSubmit={sendMessage} className="flex-grow flex items-center bg-white/10 backdrop-blur-2xl border border-white/10 rounded-[1.5rem] px-5 py-4 focus-within:bg-white/20 transition-all">
              <input 
                value={inputMsg} onChange={e => setInputMsg(e.target.value)}
                placeholder="Dire quelque chose..." 
                className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-white/40"
              />
              <button type="submit" className="text-teal-400 hover:scale-110 transition-transform"><Send size={20}/></button>
            </form>
            
            <button 
              onClick={() => setStats(s => ({...s, likes: s.likes + 1}))} 
              className="p-5 bg-white/10 backdrop-blur-2xl rounded-[1.5rem] text-white hover:bg-red-500/20 transition-all border border-white/10 group relative"
            >
              <Heart 
                size={22} 
                className={`transition-all ${stats.likes > 0 ? "fill-red-500 text-red-500 scale-110" : "group-hover:scale-110"}`}
              />
              {stats.likes > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-[8px] font-black px-2 py-0.5 rounded-full shadow-lg">
                  {stats.likes}
                </span>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
