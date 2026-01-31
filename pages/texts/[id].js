"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { 
  ArrowLeft, Star, Coins, Gift, Loader2, 
  Share2, MessageCircle, Send, CheckCircle,
  Eye, Heart, Sparkles, ShieldCheck, Trophy // Ajout de Trophy
} from "lucide-react";

// --- NOUVEAU COMPOSANT : BADGE CONCOURS ---
function BadgeConcours() {
  return (
    <div className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-2xl shadow-lg shadow-teal-600/20 mb-6 animate-in zoom-in duration-500">
      <Trophy size={14} className="animate-pulse" />
      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Candidat Officiel - Battle Poétique</span>
    </div>
  );
}

// ... (Gardez SceauCertification et CommentSection identiques) ...

export default function TextPage() {
  const router = useRouter();
  const { id } = router.query;
  const [text, setText] = useState(null);
  const [user, setUser] = useState(null);
  const [hasLiked, setHasLiked] = useState(false);

  const fetchData = useCallback(async (textId) => {
    try {
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications/${textId}.json?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        const content = JSON.parse(decodeURIComponent(escape(atob(data.content))));
        setText(content);
        return content;
      }
    } catch (e) { console.error("Fetch error", e); }
  }, []);

  useEffect(() => {
    if (router.isReady && id) {
      const stored = localStorage.getItem("lisible_user");
      if (stored) setUser(JSON.parse(stored));

      fetchData(id).then((loadedText) => {
        if (loadedText) {
          const viewKey = `view_${id}`;
          if (!localStorage.getItem(viewKey)) {
            fetch('/api/texts', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id, action: "view" })
            }).then(() => localStorage.setItem(viewKey, "true"));
          }
          // On peut aussi déclencher le handleAutoLike ici
        }
      });
    }
  }, [router.isReady, id, fetchData]);

  const handleShare = () => {
    if (!text) return;
    if (navigator.share) {
      navigator.share({ title: text.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copié !");
    }
  };

  if (!text) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-teal-600" size={40} /></div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 pb-32">
      <header className="flex justify-between items-center mb-16">
        <button onClick={() => router.back()} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-all">
          <ArrowLeft size={20} />
        </button>
        <div className="flex gap-3">
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-slate-400">
               <Eye size={14} /> <span className="text-xs font-bold">{text.views || 0}</span>
            </div>
            <button onClick={handleShare} className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-teal-600 transition-all">
              <Share2 size={20} />
            </button>
        </div>
      </header>

      <article>
        {/* AFFICHAGE CONDITIONNEL DU BADGE */}
        {(text.isConcours === true || text.isConcours === "true") && <BadgeConcours />}

        <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter mb-6 leading-[0.9]">{text.title}</h1>
        
        <p className="text-[11px] font-black text-teal-600 uppercase tracking-[0.4em] mb-16 flex items-center gap-2">
            <span className="w-8 h-[2px] bg-teal-600"></span> 
            {/* Si c'est un concours, on affiche l'ID Concurrent, sinon le nom de plume */}
            {text.isConcours ? `Concurrent ${text.authorName}` : `Par ${text.authorName}`}
        </p>
        
        <div className="prose prose-xl font-serif text-slate-800 leading-relaxed mb-24 whitespace-pre-wrap selection:bg-teal-100">
          {text.content}
        </div>
      </article>

      {/* ... (Le reste de votre page avec Sceau et Commentaires) ... */}
      <div className="flex justify-center mb-16">
          <div className="group flex flex-col items-center gap-2 scale-110">
            <div className="p-6 rounded-full bg-rose-50 text-rose-500 shadow-xl shadow-rose-500/10">
                <Heart size={32} className="fill-rose-500 animate-bounce" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">
                {text.totalLikes || 0} Appréciations
            </span>
          </div>
      </div>

      <SceauCertification 
        wordCount={text.content ? text.content.split(/\s+/).length : 0} 
        fileName={id} 
        userEmail={user?.email} 
        onValidated={() => fetchData(id)} 
        certifiedCount={text.totalCertified}
      />

      <CommentSection 
        textId={id} 
        comments={text.comments || []} 
        user={user} 
        onCommented={() => fetchData(id)} 
      />
    </div>
  );
}
