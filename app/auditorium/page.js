"use client";
import React, { useState, useEffect } from 'react';
import { Play, Pause, Headset, Calendar, User, Clock, Loader2, Music2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Auditorium() {
  const [podcasts, setPodcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingUrl, setPlayingUrl] = useState(null);

  useEffect(() => {
    const fetchPodcasts = async () => {
      try {
        // Adaptation : On utilise l'API dédiée au registre des podcasts
        const res = await fetch('/api/podcasts/register');
        if (res.ok) {
          const data = await res.json();
          // Trier par date décroissante (plus récent en premier)
          const list = Array.isArray(data.content) ? data.content : [];
          setPodcasts(list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        }
      } catch (e) {
        console.error("Erreur de chargement de l'auditorium");
      } finally {
        setLoading(false);
      }
    };
    fetchPodcasts();
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <div className="mb-12 text-center">
        <div className="inline-flex p-4 bg-indigo-100 text-indigo-600 rounded-[2rem] mb-4">
          <Headset size={32} />
        </div>
        <h1 className="text-4xl font-black italic tracking-tighter text-slate-900">L'Auditorium.</h1>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 mt-2">Archives des transmissions</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-20">
          <Loader2 className="animate-spin text-indigo-500 mb-4" size={40} />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ouverture des archives...</p>
        </div>
      ) : podcasts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {podcasts.map((podcast) => (
            <PodcastCard 
              key={podcast.id || podcast.audioUrl} 
              podcast={podcast} 
              isGlobalPlaying={playingUrl === podcast.audioUrl}
              onPlay={() => setPlayingUrl(podcast.audioUrl)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <Music2 size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">Aucun podcast n'a encore été diffusé.</p>
        </div>
      )}
    </div>
  );
}

function PodcastCard({ podcast, isGlobalPlaying, onPlay }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef(null);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      onPlay(); // Notifier le parent pour arrêter les autres
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Arrêter si un autre podcast commence à jouer
  useEffect(() => {
    if (!isGlobalPlaying && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isGlobalPlaying]);

  return (
    <div className="group bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-start gap-5">
        <button 
          onClick={togglePlay}
          className={`w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center transition-all ${
            isPlaying ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-900 text-white hover:bg-indigo-600'
          }`}
        >
          {isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" className="ml-1" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md">
              Podcast
            </span>
            <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
              <Calendar size={10} />
              {podcast.createdAt ? format(new Date(podcast.createdAt), 'dd MMMM yyyy', { locale: fr }) : 'Date inconnue'}
            </span>
          </div>
          
          <h3 className="font-bold text-slate-900 text-lg leading-tight truncate">
            {podcast.title || "Transmission sans titre"}
          </h3>
          
          <div className="flex items-center gap-3 mt-3 text-slate-500">
            <div className="flex items-center gap-1 text-[11px] font-medium">
              <User size={12} className="text-indigo-500" />
              {podcast.hostName || "Hôte anonyme"}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium">
              <Clock size={12} className="text-indigo-500" />
              {podcast.duration || "30:00"}
            </div>
          </div>
        </div>
      </div>

      <audio 
        ref={audioRef} 
        src={podcast.audioUrl} 
        onEnded={() => setIsPlaying(false)}
        className="hidden" 
      />
      
      {/* Barre de progression visuelle fictive ou réelle */}
      <div className="mt-6 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full bg-indigo-500 transition-all duration-500 ${isPlaying ? 'w-full' : 'w-0'}`}
          style={{ transitionDuration: isPlaying ? `${30*60}s` : '0s' }}
        />
      </div>
    </div>
  );
}
