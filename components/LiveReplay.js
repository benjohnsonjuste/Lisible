"use client";
import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, RotateCcw, Heart, MessageSquare, User, Volume2 } from "lucide-react";

export default function LiveReplay({ videoUrl, liveData }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [visibleItems, setVisibleItems] = useState([]);
  
  const videoRef = useRef(null);
  const processedIds = useRef(new Set()); // Pour éviter les doublons lors des retours en arrière

  // 1. Gestion de la synchronisation des réactions
  useEffect(() => {
    if (!liveData?.transcript) return;

    const syncInterval = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        const time = videoRef.current.currentTime;
        setCurrentTime(time);

        // Trouver les nouveaux items à afficher (cœurs ou commentaires)
        const newItems = liveData.transcript.filter(item => {
          return item.time <= time && !processedIds.current.has(item.id);
        });

        if (newItems.length > 0) {
          newItems.forEach(item => {
            processedIds.current.add(item.id);
            
            // Ajouter à l'affichage
            setVisibleItems(prev => [...prev, item]);

            // Retirer l'item après l'animation (4s pour les cœurs, 6s pour les messages)
            const timeout = item.type === 'heart' ? 4000 : 6000;
            setTimeout(() => {
              setVisibleItems(prev => prev.filter(i => i.id !== item.id));
            }, timeout);
          });
        }
      }
    }, 100); // Check toutes les 100ms pour une fluidité maximale

    return () => clearInterval(syncInterval);
  }, [liveData]);

  // 2. Fonctions de contrôle
  const togglePlay = () => {
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resetReplay = () => {
    videoRef.current.currentTime = 0;
    processedIds.current.clear();
    setVisibleItems([]);
    videoRef.current.play();
    setIsPlaying(true);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6 font-sans">
      <div className="relative aspect-video bg-slate-950 rounded-[3rem] overflow-hidden border-[10px] border-white shadow-2xl group">
        
        {/* LECTEUR VIDÉO / AUDIO */}
        <video 
          ref={videoRef}
          src={videoUrl}
          onLoadedMetadata={(e) => setDuration(e.target.duration)}
          className="w-full h-full object-cover"
          playsInline
        />

        {/* CALQUE DES RÉACTIONS (SYNC) */}
        <div className="absolute inset-0 pointer-events-none">
          {visibleItems.map((item) => (
            <div 
              key={item.id}
              className={`absolute bottom-10 ${item.type === 'heart' ? 'animate-live-rise' : 'animate-fade-in-up'}`}
              style={{ left: `${item.x}%` }}
            >
              {item.type === 'heart' ? (
                <Heart className="text-rose-500 fill-rose-500 drop-shadow-xl" size={40} />
              ) : (
                <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-2xl border border-slate-200 flex items-center gap-3 max-w-xs">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {item.avatar ? <img src={item.avatar} alt="" /> : <User size={14} />}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{item.user}</p>
                    <p className="text-xs text-slate-900 font-medium leading-tight">{item.text}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* OVERLAY DE CONTRÔLE AU SURVOL */}
        <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-6">
            <button onClick={togglePlay} className="text-white hover:scale-110 transition-transform">
              {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
            </button>
            
            <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden relative">
              <div 
                className="absolute inset-y-0 left-0 bg-teal-500" 
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>

            <button onClick={resetReplay} className="text-white hover:rotate-[-45deg] transition-transform">
              <RotateCcw size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* INFOS SESSION */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">Replay : {liveData?.title}</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Direct du {new Date(liveData?.startedAt).toLocaleDateString()}</p>
        </div>
        <div className="flex -space-x-3">
            <div className="w-12 h-12 rounded-full border-4 border-white bg-teal-50 flex items-center justify-center text-teal-600 shadow-sm">
                <Volume2 size={20} />
            </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes live-rise {
          0% { transform: translateY(0) scale(0.3); opacity: 0; }
          15% { opacity: 1; transform: translateY(-50px) scale(1.1); }
          100% { transform: translateY(-500px) scale(1); opacity: 0; }
        }
        @keyframes fade-in-up {
          0% { transform: translateY(20px); opacity: 0; }
          10% { opacity: 1; transform: translateY(0); }
          90% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-20px); }
        }
        .animate-live-rise { animation: live-rise 4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
        .animate-fade-in-up { animation: fade-in-up 6s ease-out forwards; }
      `}</style>
    </div>
  );
}
