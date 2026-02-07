"use client";
import React, { useState } from "react";
import Image from "next/image"; 
import { MessageCircle, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

export default function CommentSection({ textId, comments = [], user, onCommented }) {
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  const postComment = async () => {
    if (!user) return toast.error("Connectez-vous pour laisser une trace.");
    if (msg.trim().length < 2) return;
    
    setSending(true);
    try {
      const res = await fetch('/api/texts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: textId, 
          action: "comment", 
          payload: { 
            userEmail: user.email, 
            userName: user.penName || user.name || "Plume", 
            text: msg.trim(), 
            date: new Date().toISOString() 
          } 
        })
      });

      if (res.ok) { 
        setMsg(""); 
        // Callback pour rafraîchir les données localement dans le parent
        if (onCommented) onCommented(); 
        
        toast.success("Pensée publiée dans le flux"); 
        
        // Revalidation optionnelle pour mettre à jour le cache Next.js
        try {
          await fetch(`/api/revalidate?path=/texts/${textId}`);
        } catch (e) { /* Silencieux si non configuré */ }
        
      } else {
        const errData = await res.json();
        throw new Error(errData.error || "Échec de la publication");
      }
    } catch (e) { 
      toast.error(e.message || "Erreur de connexion au sanctuaire"); 
    } finally { 
      setSending(false); 
    }
  };

  return (
    <div className="mt-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8 flex items-center gap-2">
        <MessageCircle size={16} className="text-teal-600" /> Flux des Pensées
      </h3>
      
      <div className="space-y-4 mb-10">
        {comments.length === 0 ? (
          <div className="py-12 px-6 border-2 border-dashed border-slate-100 dark:border-slate-900 rounded-[2.5rem] flex flex-col items-center justify-center text-center">
             <p className="text-xs text-slate-300 italic font-medium max-w-[200px]">
              Le silence est d'or... Soyez le premier à briser la glace.
            </p>
          </div>
        ) : (
          comments.map((c, i) => (
            <div 
              key={i} 
              className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-50 dark:border-slate-800/50 shadow-sm transition-all hover:shadow-md animate-in slide-in-from-bottom-2 duration-500"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-teal-50 dark:border-teal-900/30 bg-slate-50">
                    <Image 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.userEmail || i}&backgroundColor=f1f5f9`} 
                      alt={c.userName}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-teal-600 uppercase tracking-wider">{c.userName}</span>
                    <span className="text-[8px] text-slate-300 font-bold uppercase">
                      {c.date ? new Date(c.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'Récemment'}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-serif pl-1">
                {c.text}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Barre de saisie flottante */}
      <div className="sticky bottom-6 flex gap-2 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl p-2 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl transition-all focus-within:ring-4 ring-teal-500/5 focus-within:border-teal-500/30">
        <input 
          value={msg} 
          onChange={e => setMsg(e.target.value)} 
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (!sending && msg.trim().length >= 2) postComment();
            }
          }}
          placeholder={user ? "Partagez votre ressenti..." : "Connectez-vous pour écrire..."}
          disabled={!user || sending} 
          className="flex-1 bg-transparent px-5 py-3 text-sm font-bold outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-300" 
        />
        <button 
          onClick={postComment} 
          disabled={sending || !user || msg.trim().length < 2} 
          className="p-4 bg-slate-900 dark:bg-teal-600 text-white rounded-[1.5rem] hover:bg-teal-500 active:scale-95 transition-all shadow-lg disabled:opacity-30 disabled:grayscale disabled:scale-100"
        >
          {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
        </button>
      </div>
    </div>
  );
}
