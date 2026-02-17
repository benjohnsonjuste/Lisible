"use client";
import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, MessageSquare, Heart } from "lucide-react";

export default function ReplayPlayer({ replayData }) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [visibleComments, setVisibleComments] = useState([]);
  const mediaRef = useRef(null);
  const chatRef = useRef(null);

  // Calcul du décalage temporel des commentaires par rapport au début du live
  const startTime = new Date(replayData.startedAt).getTime();
  const archivedComments = replayData.transcript.map(c => ({
    ...c,
    offset: (c.id - startTime) / 1000 // temps en secondes depuis le début
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
  }, []);

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
          <div className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest border border-white/10">
            REPLAY ARCHIVÉ
          </div>
        </div>

        {replayData.type === 'video' ? (
          <video 
            ref={mediaRef}
            src={replayData.streamUrl}
            className="w-full max-w-4xl aspect-video rounded-3xl shadow-2xl"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        ) : (
          <div className="text-center">
            <img src={replayData.hostAvatar} className="w-40 h-40 rounded-full mx-auto mb-6 border-4 border-blue-500/30" />
            <h2 className="text-2xl font-serif italic mb-8">{replayData.title}</h2>
            <audio 
              ref={mediaRef}
              src={replayData.streamUrl}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          </div>
        )}

        {/* Contrôles Custom */}
        <div className="mt-8 flex items-center gap-6 bg-slate-900/50 p-4 rounded-3xl border border-white/5">
          <button onClick={() => { mediaRef.current.currentTime -= 10 }} className="text-slate-400 hover:text-white"><RotateCcw size={20}/></button>
          <button 
            onClick={() => isPlaying ? mediaRef.current.pause() : mediaRef.current.play()}
            className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center hover:scale-110 transition-all"
          >
            {isPlaying ? <Pause fill="white"/> : <Play fill="white" className="ml-1"/>}
          </button>
          <div className="text-xs font-mono text-slate-400 w-20">
            {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* ZONE CHAT SYNCHRONISÉ */}
      <div className="w-full lg:w-96 bg-slate-900/80 border-l border-white/5 flex flex-col">
        <div className="p-6 border-b border-white/5 bg-slate-900">
          <h3 className="text-sm font-black uppercase tracking-tighter flex items-center gap-2">
            <MessageSquare size={16} className="text-blue-500"/> Discussion d'origine
          </h3>
        </div>

        <div ref={chatRef} className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth">
          {visibleComments.map((msg, i) => (
            <div key={i} className="flex gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300">
              <img src={msg.avatar} className="w-8 h-8 rounded-lg opacity-80" />
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-500 mb-1">{msg.user}</p>
                <div className="text-sm text-slate-300 bg-white/5 p-3 rounded-2xl rounded-tl-none">
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          {visibleComments.length === 0 && (
            <p className="text-center text-slate-600 text-xs mt-20 italic">Le chat s'animera au fil de l'écoute...</p>
          )}
        </div>
      </div>
    </div>
  );
}
