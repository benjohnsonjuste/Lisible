import React, { useState } from 'react';
import { Heart, MessageSquare, Share2, Bookmark } from 'lucide-react';
import { toast } from 'sonner';

const PodcastActions = ({ podcast, userEmail }) => {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleAction = async (type) => {
    if (isSyncing) return;
    setIsSyncing(true);

    // Mise à jour locale immédiate (Optimistic UI)
    if (type === 'like') setLiked(!liked);
    if (type === 'bookmark') setBookmarked(!bookmarked);

    try {
      const res = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: podcast.id,
          action: type,
          userEmail: userEmail,
          authorEmail: podcast.hostEmail || podcast.authorEmail
        })
      });

      if (!res.ok) throw new Error();
      
      toast.success(type === 'like' ? 'Ajouté aux favoris' : 'Enregistré pour plus tard');
    } catch (error) {
      // Revenir à l'état précédent en cas d'erreur
      if (type === 'like') setLiked(liked);
      if (type === 'bookmark') setBookmarked(bookmarked);
      toast.error("Erreur de synchronisation");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleShare = () => {
    navigator.share({
      title: podcast.title,
      url: window.location.href
    }).catch(() => toast.error("Partage impossible sur ce navigateur"));
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 p-2 rounded-[2rem] shadow-2xl flex items-center gap-1">
        
        {/* Bouton Like */}
        <button 
          onClick={() => handleAction('like')}
          disabled={isSyncing || liked}
          className={`p-4 rounded-full transition-all active:scale-90 ${liked ? 'bg-pink-500 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
        >
          <Heart size={20} fill={liked ? "currentColor" : "none"} />
        </button>

        {/* Bouton Commentaire */}
        <button className="p-4 rounded-full text-slate-400 hover:bg-slate-800 transition-all active:scale-90">
          <MessageSquare size={20} />
        </button>

        {/* Bouton Playlist/Bookmark */}
        <button 
          onClick={() => handleAction('bookmark')}
          disabled={isSyncing}
          className={`p-4 rounded-full transition-all active:scale-90 ${bookmarked ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
        >
          <Bookmark size={20} fill={bookmarked ? "currentColor" : "none"} />
        </button>

        <div className="w-[1px] h-6 bg-white/10 mx-2" />

        {/* Bouton Partage */}
        <button 
          onClick={handleShare}
          className="bg-white text-slate-900 px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-indigo-400 hover:text-white transition-all flex items-center gap-2"
        >
          <Share2 size={14} /> Partager
        </button>
      </div>
    </div>
  );
};

export default PodcastActions;
