"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Play, Pause, ChevronLeft, Calendar, User, Clock, Share2, Headphones, Volume2, Download, Eye, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

// Import du composant avec export nommé
import { InTextAd } from '@/components/InTextAd'; 

export default function PodcastPlayerPage() {
  const { id } = useParams();
  const router = useRouter();
  const [podcast, setPodcast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const audioRef = useRef(null);
  const hasIncrementedView = useRef(false);

  useEffect(() => {
    const fetchPodcast = async () => {
      try {
        const res = await fetch('/api/podcasts/register');
        if (res.ok) {
          const data = await res.json();
          const found = data.content.find(p => p.id === id);
          if (found) {
            setPodcast(found);
          } else {
            toast.error("Épisode introuvable");
            router.push('/auditorium');
          }
        }
      } catch (e) {
        console.error("Erreur de récupération");
      } finally {
        setLoading(false);
      }
    };
    fetchPodcast();
  }, [id, router]);

  const togglePlay = async () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
      
      if (!hasIncrementedView.current) {
        try {
          const res = await fetch('/api/interactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              id: id, 
              action: 'view' 
            })
          });
          if (res.ok) {
            const data = await res.json();
            setPodcast(prev => ({ ...prev, views: data.count }));
            hasIncrementedView.current = true;
          }
        } catch (e) {
          console.error("Erreur incrementation vues");
        }
      }
    }
    setIsPlaying(!isPlaying);
  };

  const updateProgress = () => {
    const duration = audioRef.current.duration;
    const current = audioRef.current.currentTime;
    if (duration) {
      setProgress((current / duration) * 100);
      setCurrentTime(formatSeconds(current));
    }
  };

  const formatSeconds = (s) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e) => {
    const seekTime = (e.target.value / 100) * audioRef.current.duration;
    audioRef.current.currentTime = seekTime;
    setProgress(e.target.value);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: podcast.title,
          text: `Écoutez cet épisode : ${podcast.title}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Erreur partage:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copié !");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-700" size={40} />
    </div>
  );

  if (!podcast) return null;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 relative">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-700 font-bold uppercase text-[10px] tracking-widest mb-8 transition-colors"
        >
          <ChevronLeft size={16} /> Retour à l'auditorium
        </button>

        <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden mb-8">
          <div className="bg-slate-900 p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 flex items-center justify-center">
              <Headphones size={300} className="text-white" />
            </div>
            <div className="relative z-10 flex flex-col items-center">
              <span className="bg-blue-700 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-6 inline-block">
                En cours de lecture
              </span>
              <h1 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter leading-tight mb-6">
                {podcast.title}
              </h1>
            </div>
          </div>

          <div className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-600 text-xs font-bold uppercase">
                  <User size={14} className="text-blue-700" /> {podcast.hostName}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase">
                    <Calendar size={14} className="text-blue-700" /> {format(new Date(podcast.createdAt), 'dd MMMM yyyy', { locale: fr })}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase">
                    <Eye size={14} className="text-blue-700" /> {podcast.views || 0} lectures
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleNativeShare}
                  className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-2xl hover:bg-blue-700 transition-all font-bold text-xs uppercase"
                >
                  <Share2 size={16} /> Partager
                </button>
                <a 
                  href={podcast.audioUrl}
                  download={`podcast-${podcast.title}.mp3`}
                  className="p-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all"
                  title="Télécharger l'épisode"
                >
                  <Download size={20} />
                </a>
              </div>
            </div>

            <div className="space-y-6">
              <div className="relative group">
                <input 
                  type="range"
                  value={progress}
                  onChange={handleSeek}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-700"
                />
                <div className="flex justify-between mt-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span>{currentTime}</span>
                  <span>{podcast.duration}</span>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <button 
                  onClick={togglePlay}
                  className={`w-24 h-24 rounded-[2rem] flex items-center justify-center transition-all shadow-xl shadow-blue-200 ${
                    isPlaying ? 'bg-blue-700 text-white animate-pulse' : 'bg-slate-900 text-white hover:scale-105'
                  }`}
                >
                  {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-2" />}
                </button>
              </div>

              <div className="mt-8 min-h-[250px] w-full flex items-center justify-center overflow-visible">
                <InTextAd />
              </div>
            </div>

            <audio 
              ref={audioRef}
              src={podcast.audioUrl}
              onTimeUpdate={updateProgress}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          </div>
          
          <div className="bg-slate-50 p-6 border-t border-slate-100 flex items-center justify-center gap-6 text-slate-400">
             <div className="flex items-center gap-2 text-[10px] font-black uppercase">
                <Volume2 size={14} /> Studio Qualité
             </div>
             <div className="w-1 h-1 bg-slate-300 rounded-full" />
             <div className="flex items-center gap-2 text-[10px] font-black uppercase">
                <Clock size={14} /> {podcast.duration}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
