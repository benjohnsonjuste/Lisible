"use client";
import React, { useState } from "react";
import Image from "next/image"; // Importation pour l'optimisation
import { MessageCircle, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

export default function CommentSection({ textId, comments = [], user, onCommented }) {
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  const postComment = async () => {
    if (!user) return toast.error("Connectez-vous pour commenter.");
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
            userName: user.penName || "Plume", 
            text: msg.trim(), 
            date: new Date().toISOString() 
          } 
        })
      });

      if (res.ok) { 
        setMsg(""); 
        onCommented(); 
        toast.success("Pensée publiée"); 
        
        // AUTOMATISME : Déclenche la revalidation de la page de lecture si l'API le permet
        try {
          await fetch(`/api/revalidate?path=/texte/${textId}`);
        } catch (e) { /* Optionnel selon votre setup API */ }
        
      } else {
        toast.error("Échec de la publication");
      }
    } catch (e) { 
      toast.error("Erreur de connexion"); 
    } finally { 
      setSending(false); 
    }
  };

  return (
    <div className="mt-20">
      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8 flex items-center gap-2">
        <MessageCircle size={16} /> Flux des Pensées
      </h3>
      
      <div className="space-y-4 mb-10">
        {comments.length === 0 ? (
          <p className="text-xs text-slate-300 italic text-center py-8 border-2 border-dashed border-slate-50 dark:border-slate-900 rounded-[2rem]">
            Le silence est d'or... Soyez le premier à briser la glace.
          </p>
        ) : (
          comments.map((c, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm animate-in slide-in-from-bottom-2 duration-500">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  {/* Avatar optimisé pour chaque commentateur */}
                  <div className="relative w-6 h-6 rounded-full overflow-hidden border border-teal-100 dark:border-teal-900">
                    <Image 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.userEmail || i}`} 
                      alt={c.userName}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="text-[10px] font-black text-teal-600 uppercase tracking-wider">{c.userName}</span>
                </div>
                <span className="text-[8px] text-slate-300 font-bold uppercase">{new Date(c.date).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium pl-9">
                {c.text}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="sticky bottom-6 flex gap-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-2 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl transition-all focus-within:border-teal-500/50">
        <input 
          value={msg} 
          onChange={e => setMsg(e.target.value)} 
          onKeyDown={(e) => e.key === 'Enter' && !sending && postComment()}
          placeholder={user ? "Partagez votre ressenti..." : "Connectez-vous pour écrire..."}
          disabled={!user || sending} 
          className="flex-1 bg-transparent px-4 py-3 text-sm font-bold outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-300" 
        />
        <button 
          onClick={postComment} 
          disabled={sending || !user || msg.trim().length < 2} 
          className="p-4 bg-slate-950 dark:bg-teal-600 text-white rounded-2xl hover:bg-teal-500 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100"
        >
          {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
        </button>
      </div>
    </div>
  );
}
