"use client";
import React, { useEffect, useState, useRef } from "react";
import { Mic, Video, VideoOff, MicOff, Heart, Send, Users, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LisibleClub({ roomId, mode = "video", isHost = false }) {
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState("");
  const [stats, setStats] = useState({ viewers: 0, likes: 0 });
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loggedUser = JSON.parse(localStorage.getItem("lisible_user"));
    setUser(loggedUser);
  }, []);

  // Simulation du lancement du Live et notification
  const startLive = async () => {
    setJoined(true);
    if (isHost) {
      toast.success("Vous êtes en direct !");
      // Appeler l'API de notification globale
      await fetch('/api/notifications/broadcast-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: user?.name || "Un auteur",
          mode: mode,
          roomId: roomId
        })
      });
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    const msg = { id: Date.now(), user: user?.name || "Anonyme", text: inputMsg };
    setMessages(prev => [...prev, msg].slice(-20)); // Garde les 20 derniers messages
    setInputMsg("");
  };

  return (
    <div className="max-w-4xl mx-auto h-[85vh] relative bg-slate-950 rounded-[3rem] overflow-hidden shadow-2xl">
      
      {!joined ? (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
          <h2 className="text-3xl font-black mb-4 italic">Lisible Club</h2>
          <p className="text-slate-400 mb-8 max-w-xs text-sm">Prêt à rejoindre la session en direct ?</p>
          <button onClick={startLive} className="bg-teal-500 text-slate-900 px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-teal-400 transition-all">
            {isHost ? "Lancer le Live" : "Rejoindre le Live"}
          </button>
        </div>
      ) : (
        <>
          {/* Flux Vidéo/Audio */}
          <div className="absolute inset-0 flex items-center justify-center">
            {mode === "video" ? (
              <div className="w-full h-full bg-slate-800 animate-pulse flex items-center justify-center">
                 <p className="text-white/20 italic">Flux vidéo en direct...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6">
                <div className="w-32 h-32 bg-teal-500/20 rounded-full flex items-center justify-center border-2 border-teal-500 animate-pulse">
                  <Mic className="text-teal-500" size={48} />
                </div>
                <p className="text-teal-500 font-black tracking-widest text-xs uppercase">Podcast Audio</p>
              </div>
            )}
          </div>

          {/* Header Stats */}
          <div className="absolute top-8 left-8 right-8 flex justify-between items-start z-10">
            <div className="flex gap-2">
              <div className="bg-red-600 px-3 py-1 rounded-full text-[10px] font-black text-white flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"/> DIRECT
              </div>
              <div className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-black flex items-center gap-2 border border-white/10">
                <Users size={12}/> {stats.viewers}
              </div>
            </div>
            <button onClick={() => window.location.href='/bibliotheque'} className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white"><X/></button>
          </div>

          {/* Chat style Instagram (bas gauche) */}
          <div className="absolute bottom-28 left-6 w-72 flex flex-col gap-2 z-10 max-h-60 overflow-hidden">
            {messages.map((m) => (
              <div key={m.id} className="bg-black/20 backdrop-blur-sm p-2 rounded-xl border border-white/5 self-start animate-in slide-in-from-left-2">
                <p className="text-teal-400 font-black text-[10px] uppercase">{m.user}</p>
                <p className="text-white text-xs">{m.text}</p>
              </div>
            ))}
          </div>

          {/* Barre d'action */}
          <div className="absolute bottom-8 left-6 right-6 flex items-center gap-3 z-10">
            <form onSubmit={sendMessage} className="flex-grow flex items-center bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3">
              <input 
                value={inputMsg} onChange={e => setInputMsg(e.target.value)}
                placeholder="Commenter..." 
                className="bg-transparent border-none outline-none text-white text-sm w-full"
              />
              <button type="submit" className="text-teal-400"><Send size={18}/></button>
            </form>
            <button onClick={() => setStats(s => ({...s, likes: s.likes + 1}))} className="p-4 bg-white/10 backdrop-blur-xl rounded-2xl text-white hover:bg-red-500/20 transition-all border border-white/10 relative">
              <Heart size={20} className={stats.likes > 0 ? "fill-red-500 text-red-500" : ""}/>
              {stats.likes > 0 && <span className="absolute -top-2 -right-1 bg-red-600 text-[8px] font-black px-1.5 py-0.5 rounded-full">{stats.likes}</span>}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
