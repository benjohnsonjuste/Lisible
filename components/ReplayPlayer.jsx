"use client";
import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, MessageSquare, Heart } from "lucide-react";

export default function ReplayPlayer({ replayData }) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [visibleComments, setVisibleComments] = useState([]);
  const mediaRef = useRef(null);
  const chatRef = useRef(null);

  // Calcul du décalage temporel des commentaires (transcript)
  // On utilise l'ID du message comme timestamp de création
  const startTime = new Date(replayData.startedAt).getTime();
  const archivedComments = (replayData.transcript || []).map(c => ({
    ...c,
    offset: (Number(c.id) - startTime) / 1000 // temps en secondes depuis le début
  }));

  // Synchronisation du chat avec le média
  useEffect(() => {
    const syncChat = () => {
      const now = mediaRef.current?.currentTime || 0;
      setCurrentTime(now);
      
      // On filtre les commentaires dont l'offset est inférieur au temps actuel
      const toShow = archivedComments.filter(c => c.offset <= now);
      setVisibleComments(toShow);
    };

    const interval = setInterval(syncChat, 500);
    return () => clearInterval(interval);
  }, [archivedComments]);

  // Auto-scroll du chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [visibleComments]);

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#020617] text-white">
      {/* ZONE MÉDIA */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-6 bg-black">
        <div className="absolute top-6 left-6 flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest border border-white/10 text-blue-400">
            REPLAY ARCHIVÉ
          </div>
        </div>

        {replayData.type === 'video' ? (
          <video 
            ref={mediaRef}
            src={replayData.streamUrl || ""}
            className="w-full max-w-4xl aspect-video rounded-[2.5rem] shadow-2xl border border-white/5"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        ) : (
          <div className="text-center">
            <div className="relative inline-block mb-8">
                <div className="absolute inset-0 bg-blue-500 rounded-full blur-3xl opacity-20 animate-pulse" />
                <img 
                    src={replayData.hostAvatar || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${replayData.admin}`} 
                    className="relative w-48 h-48 rounded-[3rem] mx-auto border-4 border-white/10 object-cover" 
                />
            </div>
            <h2 className="text-3xl font-black italic tracking-tighter mb-2">{replayData.title}</h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-8">Session Audio terminée</p>
            <audio 
              ref={mediaRef}
              src={replayData.streamUrl || ""}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          </div>
        )}

        {/* Contrôles Custom */}
        <div className="mt-12 flex items-center gap-6 bg-slate-900/80 backdrop-blur-2xl px-8 py-5 rounded-[2rem] border border-white/5 shadow-2xl">
          <button onClick={() => { if(mediaRef.current) mediaRef.current.currentTime -= 10 }} className="text-slate-500 hover:text-white transition-colors">
            <RotateCcw size={22}/>
          </button>
          
          <button 
            onClick={() => isPlaying ? mediaRef.current?.pause() : mediaRef.current?.play()}
            className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-blue-600/20"
          >
            {isPlaying ? <Pause size={24} fill="currentColor"/> : <Play size={24} fill="currentColor" className="ml-1"/>}
          </button>

          <div className="text-xs font-black font-mono text-slate-400 w-20 text-center tracking-tighter">
            {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* ZONE CHAT SYNCHRONISÉ */}
      <div className="w-full lg:w-96 bg-slate-950/50 backdrop-blur-3xl border-l border-white/5 flex flex-col">
        <div className="p-8 border-b border-white/5 bg-black/20">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 text-slate-400">
            <MessageSquare size={16} className="text-blue-500"/> Discussion d'origine
          </h3>
        </div>

        <div ref={chatRef} className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth">
          {visibleComments.map((msg, i) => (
            <div key={i} className="flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <img src={msg.avatar || `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${msg.user}`} className="w-10 h-10 rounded-2xl border border-white/5 object-cover" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                    <p className="text-[11px] font-black text-white italic">{msg.user}</p>
                    <span className="text-[9px] font-medium text-slate-600">{Math.floor(msg.offset / 60)}:{(msg.offset % 60).toFixed(0).padStart(2, '0')}</span>
                </div>
                <div className="text-[13px] leading-relaxed text-slate-300 bg-white/5 p-4 rounded-3xl rounded-tl-none border border-white/5 shadow-sm">
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          {visibleComments.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale">
                <MessageSquare size={40} className="mb-4" />
                <p className="text-center text-[10px] font-black uppercase tracking-widest">Le chat s'animera bientôt</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
