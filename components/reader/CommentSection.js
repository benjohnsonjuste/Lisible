import React, { useState } from "react";
import { MessageCircle, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

export default function CommentSection({ textId, comments = [], user, onCommented }) {
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  const postComment = async () => {
    if (!user) return toast.error("Connectez-vous.");
    if (msg.trim().length < 2) return;
    setSending(true);
    try {
      const res = await fetch('/api/texts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: textId, action: "comment", payload: { userEmail: user.email, userName: user.penName || "Plume", text: msg.trim(), date: new Date().toISOString() } })
      });
      if (res.ok) { setMsg(""); onCommented(); toast.success("Publié"); }
    } catch (e) { toast.error("Erreur"); }
    finally { setSending(false); }
  };

  return (
    <div className="mt-20">
      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8 flex items-center gap-2"><MessageCircle size={16} /> Flux des Pensées</h3>
      <div className="space-y-4 mb-10">
        {comments.length === 0 ? <p className="text-xs text-slate-300 italic text-center py-4">Soyez le premier...</p> : comments.map((c, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm animate-in slide-in-from-bottom-2">
            <div className="flex justify-between items-center mb-1"><span className="text-[10px] font-black text-teal-600 uppercase">{c.userName}</span><span className="text-[8px] text-slate-300 font-bold">{new Date(c.date).toLocaleDateString()}</span></div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{c.text}</p>
          </div>
        ))}
      </div>
      <div className="sticky bottom-6 flex gap-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-2 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl">
        <input value={msg} onChange={e => setMsg(e.target.value)} placeholder="Écrire..." disabled={!user || sending} className="flex-1 bg-transparent px-4 py-3 text-sm font-bold outline-none" />
        <button onClick={postComment} disabled={sending || !user} className="p-4 bg-slate-900 dark:bg-teal-600 text-white rounded-2xl hover:bg-teal-600 transition-all">{sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}</button>
      </div>
    </div>
  );
}
