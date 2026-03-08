"use client";
import React, { useState, useEffect } from 'react';
import { Heart, MessageSquare, Share2, Award, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
// Importation du composant de commentaires
import Comment from './Comment'; 

const PodcastActions = ({ podcast, user }) => {
  const [liked, setLiked] = useState(false);
  const [certified, setCertified] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const userEmail = user?.email;
  const authorEmail = podcast.hostEmail || podcast.authorEmail || podcast.email;

  // Synchronisation locale
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem(`interact_${podcast.id}`) || '{}');
    if (history.like) setLiked(true);
    if (history.certify) setCertified(true);
  }, [podcast.id]);

  const handleAction = async (type) => {
    if (!userEmail) return toast.error("Connectez-vous pour interagir.");
    if (isSyncing) return;
    if (type === 'like' && liked) return;
    if (type === 'certify' && certified) return;

    setIsSyncing(true);

    try {
      const res = await fetch('/api/github-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: type === 'like' ? "toggle_like" : "certify_content",
          id: podcast.id,
          userEmail: userEmail,
          authorEmail: authorEmail,
          textTitle: podcast.title,
          isPodcast: true
        })
      });

      const data = await res.json();

      if (res.ok) {
        if (type === 'like') {
          setLiked(true);
          toast.success("Coup de cœur enregistré");
        }
        if (type === 'certify') {
          setCertified(true);
          toast.success("Sceau apposé (+1 Li transféré)");
        }

        const history = JSON.parse(localStorage.getItem(`interact_${podcast.id}`) || '{}');
        history[type] = true;
        localStorage.setItem(`interact_${podcast.id}`, JSON.stringify(history));
      }
    } catch (error) {
      toast.error("Connexion au Grand Livre impossible");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: podcast.title,
        url: window.location.href
      }).catch(() => null);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copié");
    }
  };

  return (
    <>
      {/* Barre d'actions flottante */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] w-full max-w-fit px-4">
        <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 p-2 rounded-[2.5rem] shadow-2xl flex items-center gap-1">
          
          {/* Like */}
          <button 
            onClick={() => handleAction('like')}
            disabled={isSyncing || liked}
            className={`p-4 rounded-full transition-all active:scale-90 ${liked ? 'text-rose-500' : 'text-slate-400 hover:bg-white/5'}`}
          >
            {isSyncing ? <Loader2 size={20} className="animate-spin" /> : <Heart size={20} fill={liked ? "currentColor" : "none"} />}
          </button>

          {/* Toggle Commentaires */}
          <button 
            onClick={() => setShowComments(!showComments)}
            className={`p-4 rounded-full transition-all active:scale-90 ${showComments ? 'bg-teal-500 text-white' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <MessageSquare size={20} fill={showComments ? "currentColor" : "none"} />
          </button>

          {/* Certifier */}
          <button 
            onClick={() => handleAction('certify')}
            disabled={isSyncing || certified}
            className={`p-4 rounded-full transition-all active:scale-90 ${certified ? 'text-teal-400' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <Award size={20} fill={certified ? "currentColor" : "none"} />
          </button>

          <div className="w-[1px] h-6 bg-white/10 mx-2" />

          {/* Partager */}
          <button 
            onClick={handleShare}
            className="bg-white text-slate-950 px-6 py-3.5 rounded-full font-black text-[10px] uppercase tracking-[0.2em] hover:bg-teal-400 hover:text-white transition-all flex items-center gap-2 group"
          >
            <Share2 size={14} /> <span className="hidden sm:inline">Partager</span>
          </button>
        </div>
      </div>

      {/* Overlay des Commentaires (Tiroir) */}
      {showComments && (
        <div className="fixed inset-0 z-[100] bg-white animate-in slide-in-from-bottom duration-500 overflow-y-auto">
          <div className="max-w-2xl mx-auto pt-10 pb-32">
            <div className="flex justify-end px-4 mb-4">
              <button 
                onClick={() => setShowComments(false)}
                className="p-3 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <Comment 
              textId={podcast.id}
              comments={podcast.comments || []}
              user={user}
              authorEmail={authorEmail}
              textTitle={podcast.title}
              onCommented={() => {
                // Optionnel : refresh des données ici
                toast.success("Résonance ajoutée au flux");
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default PodcastActions;
