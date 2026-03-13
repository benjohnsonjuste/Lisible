"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Headset, Calendar, User, Clock, Loader2, Music2, Share2, Eye, Mic2, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import Link from 'next/link';

export default function Auditorium() {
  const [podcasts, setPodcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPlayingUrl, setCurrentPlayingUrl] = useState(null);
  const [adVisible, setAdVisible] = useState(true);

  useEffect(() => {
    const fetchPodcasts = async () => {
      try {
        const res = await fetch('/api/podcasts/register');
        if (res.ok) {
          const data = await res.json();
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

  // Injection du script Adsterra
  useEffect(() => {
    if (adVisible && !loading) {
      const container = document.getElementById("ad-auditorium-bottom");
      if (container) {
        container.innerHTML = "";
        const script = document.createElement("script");
        script.type = "text/javascript";
        script.src = "https://pl28594689.effectivegatecpm.com/62/bc/8f/62bc8f4d06d16b0f6d6297a4e94cfdfd.js";
        script.async = true;
        container.appendChild(script);
      }
    }
  }, [adVisible, loading]);

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 min-h-screen">
      <div className="mb-12 text-center">
        <div className="inline-flex p-4 bg-indigo-100 text-indigo-600 rounded-[2rem] mb-4">
          <Headset size={32} />
        </div>
        <h1 className="text-4xl font-black italic tracking-tighter text-slate-900">L'Auditorium.</h1>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 mt-2">Archives des transmissions</p>
      </div>

      {/* Lien vers le Studio */}
      <div className="mb-8">
        <Link 
          href="https://lisible.biz/studio/podcast" 
          className="group flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-[2rem] hover:bg-indigo-600 transition-all duration-300 shadow-lg"
        >
          <div className="flex items-center gap-4 ml-2">
            <div className="bg-white/10 p-2 rounded-xl text-white group-hover:scale-110 transition-transform">
              <Mic2 size={20} />
            </div>
            <span className="text-white font-bold tracking-tight">Accéder au studio pour lancer un podcast</span>
          </div>
          <div className="mr-2 h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:bg-white group-hover:text-indigo-600 transition-all">
            <Play size={14} fill="currentColor" />
          </div>
        </Link>
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
              isActive={currentPlayingUrl === podcast.audioUrl}
              onPlay={() => setCurrentPlayingUrl(podcast.audioUrl)}
              onPause={() => setCurrentPlayingUrl(null)}
              setPodcasts={setPodcasts}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <Music2 size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">Aucun podcast n'a encore été diffusé.</p>
        </div>
      )}

      {/* Zone Adsterra en fin de page */}
      {!loading && adVisible && (
        <div className="mt-20 pt-12 border-t border-slate-100 flex flex-col items-center">
          <div className="flex items-center justify-between w-full max-w-xl mb-4 px-6">
            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Sponsorisé</span>
            <button onClick={() => setAdVisible(false)} className="text-slate-300 hover:text-rose-500 transition-colors">
              <X size={12} />
            </button>
          </div>
          <div id="ad-auditorium-bottom" className="min-h-[100px] w-full flex items-center justify-center bg-white rounded-[2rem] p-4 shadow-sm border border-slate-100">
            {/* Injection du script Adsterra */}
          </div>
        </div>
      )}
    </div>
  );
}

function PodcastCard({ podcast, isActive, onPlay, onPause, setPodcasts }) {
  const audioRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const hasIncrementedView = useRef(false);

  useEffect(() => {
    if (isActive) {
      audioRef.current.play().catch(() => onPause());
    } else {
      audioRef.current.pause();
    }
  }, [isActive, onPause]);

  const handleTimeUpdate = () => {
    const duration = audioRef.current.duration;
    const ct = audioRef.current.currentTime;
    if (duration) {
      setProgress((ct / duration) * 100);
    }
  };

  const togglePlay = async () => {
    if (isActive) {
      onPause();
    } else {
      onPlay();
      
      if (!hasIncrementedView.current) {
        try {
          const res = await fetch('/api/podcasts/view', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: podcast.id })
          });
          if (res.ok) {
            const data = await res.json();
            hasIncrementedView.current = true;
            setPodcasts(prev => prev.map(p => 
              p.id === podcast.id ? { ...p, views: data.views } : p
            ));
          }
        } catch (e) {
          console.error("Erreur incrementation vues");
        }
      }
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: podcast.title,
      text: `Écoutez "${podcast.title}" par ${podcast.hostName} sur l'Auditorium.`,
      url: `${window.location.origin}/auditorium/${podcast.id}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success("Lien copié dans le presse-papier");
      }
    } catch (err) {
      console.error("Erreur de partage:", err);
    }
  };

  return (
    <div className={`group bg-white border p-6 rounded-[2.5rem] transition-all duration-300 ${
      isActive ? 'border-indigo-500 shadow-2xl scale-[1.02]' : 'border-slate-100 shadow-xl hover:shadow-2xl'
    }`}>
      <div className="flex items-start gap-5">
        <button 
          onClick={togglePlay}
          className={`w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center transition-all ${
            isActive ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-900 text-white hover:bg-indigo-600'
          }`}
        >
          {isActive ? <Pause fill="currentColor" size={24} /> : <Play fill="currentColor" size={24} className="ml-1" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md">
                Podcast
              </span>
              <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                <Calendar size={10} />
                {podcast.createdAt ? format(new Date(podcast.createdAt), 'dd MMM yyyy', { locale: fr }) : 'Date inconnue'}
              </span>
            </div>
            <button 
              onClick={handleShare}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
              title="Partager"
            >
              <Share2 size={16} />
            </button>
          </div>
          
          <Link href={`/auditorium/${podcast.id}`}>
            <h3 className="font-bold text-slate-900 text-lg leading-tight truncate pr-2 hover:text-indigo-600 transition-colors cursor-pointer">
              {podcast.title}
            </h3>
          </Link>
          
          <div className="flex flex-col gap-1 mt-3">
            <div className="flex items-center gap-4 text-slate-500">
              <div className="flex items-center gap-1 text-[11px] font-medium">
                <User size={12} className="text-indigo-500" />
                {podcast.hostName}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-medium">
                <Clock size={12} className="text-indigo-500" />
                {podcast.duration}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-medium">
                <Eye size={12} className="text-indigo-500" />
                {podcast.views || 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      <audio 
        ref={audioRef} 
        src={podcast.audioUrl} 
        onTimeUpdate={handleTimeUpdate}
        onEnded={onPause}
        className="hidden" 
      />
      
      <div className="mt-6">
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        {isActive && (
           <p className="text-[9px] font-bold text-indigo-500 mt-2 animate-pulse uppercase tracking-widest">
             Transmission active...
           </p>
        )}
      </div>
    </div>
  );
}
