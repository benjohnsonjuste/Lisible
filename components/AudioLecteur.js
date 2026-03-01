"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Volume2, User, UserCheck, Sparkles, Loader2, Headphones } from 'lucide-react';

export default function AudioLecteur({ titre, contenu, auteurNom }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Prêt à l'écoute");
  const [progress, setProgress] = useState(0);
  
  // Remplacement de synth par un objet Audio natif
  const audioRef = useRef(null);
  const playlist = useRef([]);
  const currentIndex = useRef(0);

  useEffect(() => {
    // Initialisation de l'objet audio
    audioRef.current = new Audio();
    
    // Gestionnaire de fin de morceau pour enchaîner les URLs
    const handleEnded = () => {
      currentIndex.current++;
      if (currentIndex.current < playlist.current.length) {
        setStatus(`Lecture : ${currentIndex.current + 1}/${playlist.current.length}`);
        setProgress((currentIndex.current / playlist.current.length) * 100);
        audioRef.current.src = playlist.current[currentIndex.current];
        audioRef.current.play().catch(e => console.error("Erreur enchaînement:", e));
      } else {
        setIsPlaying(false);
        setStatus("Lecture terminée");
        setProgress(100);
        currentIndex.current = 0;
      }
    };

    audioRef.current.addEventListener('ended', handleEnded);
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('ended', handleEnded);
      }
    };
  }, []);

  const handleStart = async () => {
    // Si en pause, on reprend
    if (playlist.current.length > 0 && audioRef.current.paused) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    setLoading(true);
    setStatus("Analyse du texte...");

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: contenu, title: titre, userName: auteurNom })
      });
      const data = await res.json();

      if (data.urls && data.urls.length > 0) {
        playlist.current = data.urls;
        currentIndex.current = 0;
        
        // Chargement du premier morceau (Jingle + début texte)
        audioRef.current.src = playlist.current[0];
        setStatus("Démarrage de l'IA...");
        
        await audioRef.current.play();
        setIsPlaying(true);
        setStatus(`Lecture : 1/${playlist.current.length}`);
      }
    } catch (e) {
      console.error("Erreur de lecture IA:", e);
      setStatus("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setProgress(0);
    currentIndex.current = 0;
    setStatus("Prêt à l'écoute");
  };

  return (
    <div className="bg-[#111] text-white p-8 rounded-[2rem] border-b-4 border-teal-500 shadow-2xl mb-12 relative overflow-hidden font-sans">
      
      {/* Waveform Design */}
      <div className="flex items-end gap-1 h-12 mb-6 opacity-30">
        {[...Array(30)].map((_, i) => (
          <div key={i} className={`flex-1 bg-teal-500 rounded-full transition-all duration-300 ${isPlaying ? 'animate-pulse' : 'h-2'}`} 
               style={{ height: isPlaying ? `${20 + Math.random() * 80}%` : '10%' }} />
        ))}
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
           <div className="relative">
              <div className={`w-20 h-20 rounded-full border-2 border-teal-500/30 flex items-center justify-center ${isPlaying ? 'rotate-180 duration-[5000ms] transition-transform' : ''}`}>
                <Headphones size={32} className="text-teal-500" />
              </div>
              {isPlaying && <span className="absolute -top-1 -right-1 flex h-4 w-4"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span><span className="relative inline-flex rounded-full h-4 w-4 bg-teal-500"></span></span>}
           </div>
           <div>
             <h3 className="text-2xl font-black italic tracking-tighter leading-none">{titre}</h3>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">{status}</p>
           </div>
        </div>
      </div>

      {/* Barre de Progression */}
      <div className="mt-8 relative h-1 bg-white/10 rounded-full overflow-hidden">
        <div className="absolute top-0 left-0 h-full bg-teal-500 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-8 flex gap-4">
        <button 
          onClick={isPlaying ? () => { audioRef.current.pause(); setIsPlaying(false); } : handleStart}
          disabled={loading}
          className="flex-[3] h-16 bg-white text-black rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl"
        >
          {loading ? <Loader2 className="animate-spin" /> : isPlaying ? <Pause fill="black" /> : <Play fill="black" />}
          {isPlaying ? "Pause" : "Écouter l'œuvre"}
        </button>
        <button onClick={handleStop} className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-rose-600 transition-all">
          <Square size={20} fill="currentColor" />
        </button>
      </div>
    </div>
  );
}
