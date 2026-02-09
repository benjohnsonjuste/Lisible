"use client";
import React, { useState } from "react";
import Image from "next/image"; 
import { MessageCircle, Loader2, Send, Sparkles, Quote } from "lucide-center";
import { toast } from "sonner";

export default function CommentSection({ textId, comments = [], user, onCommented }) {
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  const postComment = async () => {
    if (!user) return toast.error("Connectez-vous pour laisser une trace.");
    if (msg.trim().length < 2) return;
    
    setSending(true);
    const tid = toast.loading("Transmission de votre pensée...");

    try {
      // Utilisation de l'API unifiée github-db
      const res = await fetch('/api/github-db', {
        method: 'POST', // Utilisation de POST pour les actions
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: "comment", // L'action identifiée par ton API
          id: textId, 
          userEmail: user.email, 
          userName: user.penName || user.name || "Plume", 
          comment: msg.trim(), 
          date: new Date().toISOString() 
        })
      });

      if (res.ok) { 
        setMsg(""); 
        if (onCommented) onCommented(); 
        toast.success("Pensée publiée avec succès", { id: tid }); 
        
        // Revalidation optionnelle pour mettre à jour le cache Next.js
        try {
          await fetch(`/api/revalidate?path=/texts/${textId}`);
        } catch (e) { /* Silencieux */ }
        
      } else {
        const errData = await res.json();
        throw new Error(errData.error || "Échec de la publication");
      }
    } catch (e) { 
      toast.error(e.message || "Le sanctuaire est momentanément injoignable", { id: tid }); 
    } finally { 
      setSending(false); 
    }
  };

  return (
    <div className="mt-32 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 px-4">
      <header className="flex items-center justify-between mb-12 border-b border-slate-100 pb-6">
        <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 flex items-center gap-3">
          <MessageCircle size={18} className="text-teal-600" /> Flux des Pensées
        </h3>
        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">
          {comments.length} Résonance{comments.length > 1 ? 's' : ''}
        </span>
      </header>
      
      <div className="space-y-8 mb-24">
        {comments.length === 0 ? (
          <div className="py-20 px-10 border-2 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-center group transition-colors hover:border-teal-100">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Quote size={24} className="text-slate-200 group-hover:text-teal-200" />
             </div>
             <p className="text-sm text-slate-400 italic font-serif leading-relaxed max-w-[280px]">
              "Le silence est l'écrin des grands textes."<br />
              <span className="text-[10px] font-black uppercase tracking-tighter not-italic mt-2 block opacity-30">Soyez la première résonance</span>
            </p>
          </div>
        ) : (
          [...comments].reverse().map((c, i) => (
            <div 
              key={i} 
              className="group animate-in slide-in-from-bottom-4 duration-700"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex gap-5">
                <div className="relative shrink-0 w-12 h-12 rounded-[1.25rem] overflow-hidden border-2 border-white shadow-md bg-slate-100 group-hover:rotate-3 transition-transform">
                  <Image 
                    src={c.userPic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.userEmail || i}&backgroundColor=f1f5f9`} 
                    alt={c.userName}
                    fill
                    className="object-cover"
                  />
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      {c.userName}
                      {c.userEmail === user?.email && <Sparkles size={10} className="text-amber-400" />}
                    </span>
                    <span className="text-[9px] text-slate-300 font-bold uppercase tracking-tighter">
                      {c.date ? new Date(c.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'Maintenant'}
                    </span>
                  </div>
                  <div className="bg-white p-6 rounded-[1.8rem] rounded-tl-none border border-slate-100 shadow-sm group-hover:shadow-md transition-shadow relative">
                    <p className="text-[15px] text-slate-700 leading-relaxed font-serif italic">
                      {c.text || c.comment}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Barre de saisie flottante */}
      <div className="sticky bottom-8 z-50">
        <div className="bg-white/90 backdrop-blur-2xl p-3 rounded-[2.5rem] border border-white shadow-2xl flex items-center gap-3 ring-1 ring-slate-900/5 focus-within:ring-teal-500/20 transition-all group">
          <input 
            value={msg} 
            onChange={e => setMsg(e.target.value)} 
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!sending && msg.trim().length >= 2) postComment();
              }
            }}
            placeholder={user ? "Une pensée à partager..." : "Connectez-vous pour commenter"}
            disabled={!user || sending} 
            className="flex-1 bg-transparent px-4 py-4 text-sm font-bold outline-none text-slate-800 placeholder:text-slate-300" 
          />
          
          <button 
            onClick={postComment} 
            disabled={sending || !user || msg.trim().length < 2} 
            className="shrink-0 flex items-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-[1.8rem] hover:bg-teal-600 active:scale-95 transition-all shadow-xl disabled:opacity-20"
          >
            {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
