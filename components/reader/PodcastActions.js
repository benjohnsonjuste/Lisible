"use client";
import React, { useState, useEffect } from 'react';
import { Heart, MessageSquare, Share2, Award, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const PodcastActions = ({ podcast, userEmail }) => {
  const [liked, setLiked] = useState(false);
  const [certified, setCertified] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Synchronisation initiale avec le localStorage pour éviter les clics inutiles
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem(`interact_${podcast.id}`) || '{}');
    if (history.like) setLiked(true);
    if (history.certify) setCertified(true);
  }, [podcast.id]);

  const handleAction = async (type) => {
    if (isSyncing) return;
    
    // Si déjà liké ou certifié (via l'UI), on bloque côté client pour économiser l'API
    if (type === 'like' && liked) return toast.info("Déjà liké !");
    if (type === 'certify' && certified) return toast.info("Sceau déjà apposé !");

    setIsSyncing(true);

    try {
      const res = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: podcast.id,
          action: type,
          userEmail: userEmail,
          authorEmail: podcast.hostEmail || podcast.authorEmail || podcast.email
        })
      });

      const data = await res.json();

      if (data.alreadyDone) {
        toast.info("Action déjà enregistrée sur cet appareil");
        if (type === 'like') setLiked(true);
        if (type === 'certify') setCertified(true);
      } else if (res.ok) {
        // Succès : on verrouille l'état localement
        if (type === 'like') {
          setLiked(true);
          toast.success("Coup de cœur envoyé !");
        }
        if (type === 'certify') {
          setCertified(true);
          toast.success("Sceau apposé (+1 Li pour l'hôte)");
        }

        // Sauvegarde locale pour persistance visuelle immédiate
        const history = JSON.parse(localStorage.getItem(`interact_${podcast.id}`) || '{}');
        history[type] = true;
        localStorage.setItem(`interact_${podcast.id}`, JSON.stringify(history));
      }
    } catch (error) {
      toast.error("Erreur de connexion au studio");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Podcast : ${podcast.title} | Lisible`,
        text: `Écoutez "${podcast.title}" sur Lisible`,
        url: window.location.href
      }).catch(() => null);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copié !");
    }
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-fit px-4">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 p-2 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-1">
        
        {/* Bouton Like (Coup de cœur) */}
        <button 
          onClick={() => handleAction('like')}
          disabled={isSyncing || liked}
          className={`group relative p-4 rounded-full transition-all active:scale-90 ${liked ? 'text-rose-500' : 'text-slate-400 hover:bg-white/5'}`}
          title="Liker"
        >
          {isSyncing ? <Loader2 size={20} className="animate-spin" /> : <Heart size={20} fill={liked ? "currentColor" : "none"} className={liked ? "animate-pulse" : ""} />}
          {liked && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span></span>}
        </button>

        {/* Bouton Commentaire */}
        <button 
          className="p-4 rounded-full text-slate-400 hover:bg-white/5 transition-all active:scale-90"
          title="Commenter"
        >
          <MessageSquare size={20} />
        </button>

        {/* Bouton Certifier (Sceau) - Remplace le Bookmark simple */}
        <button 
          onClick={() => handleAction('certify')}
          disabled={isSyncing || certified}
          className={`group relative p-4 rounded-full transition-all active:scale-90 ${certified ? 'text-teal-400' : 'text-slate-400 hover:bg-white/5'}`}
          title="Apposer un Sceau"
        >
          <Award size={20} fill={certified ? "currentColor" : "none"} />
          {certified && <span className="absolute -top-1 -right-1 h-2 w-2 bg-teal-400 rounded-full shadow-[0_0_8px_rgba(45,212,191,0.6)]"></span>}
        </button>

        <div className="w-[1px] h-6 bg-white/10 mx-2" />

        {/* Bouton Partage */}
        <button 
          onClick={handleShare}
          className="bg-white text-slate-950 px-6 py-3.5 rounded-full font-black text-[10px] uppercase tracking-[0.2em] hover:bg-teal-400 hover:text-white transition-all flex items-center gap-2 group"
        >
          <Share2 size={14} className="group-hover:rotate-12 transition-transform" /> 
          <span className="hidden sm:inline">Partager</span>
        </button>
      </div>
    </div>
  );
};

export default PodcastActions;
