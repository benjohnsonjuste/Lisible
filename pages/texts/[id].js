"use client";
import React, { useEffect, useState, useCallback, use } from "react";
import { Heart, Share2, ArrowLeft, Eye, Loader2, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function TextPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const textId = params?.id;
  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const logged = localStorage.getItem("lisible_user");
    if (logged) setUser(JSON.parse(logged));

    async function fetchData() {
      try {
        const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications/${textId}.json?t=${Date.now()}`);
        const fileData = await res.json();
        const content = JSON.parse(decodeURIComponent(escape(atob(fileData.content))));
        setText(content);

        // Compteur de vue
        fetch("/api/texts", { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ id: textId, action: "view" })});
      } catch (e) { toast.error("Erreur de chargement"); }
      setLoading(false);
    }
    fetchData();
  }, [textId]);

  const handleLike = async () => {
    if (!user) return toast.error("Connectez-vous !");
    const res = await fetch("/api/texts", { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ id: textId, action: "like", payload: { email: user.email }})});
    if (res.ok) setText(await res.json());
  };

  const handleComment = async () => {
    if (!newComment.trim() || !user) return;
    const res = await fetch("/api/texts", { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ id: textId, action: "comment", payload: { userName: user.penName || user.name, text: newComment }})});
    if (res.ok) { setText(await res.json()); setNewComment(""); toast.success("Publié !"); }
  };

  if (loading || !text) return <div className="py-40 text-center animate-pulse font-black text-teal-600">CHARGEMENT...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-12">
      <Link href="/bibliotheque" className="text-slate-400 font-black text-[10px] uppercase flex items-center gap-2 tracking-widest"><ArrowLeft size={16}/> Bibliothèque</Link>
      
      <article className="bg-white rounded-[3rem] p-8 md:p-16 shadow-2xl border border-slate-50">
        <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter mb-10 leading-none">{text.title}</h1>
        <div className="font-serif text-xl md:text-2xl leading-relaxed text-slate-800 whitespace-pre-wrap mb-12">{text.content}</div>
        <div className="flex justify-between items-center pt-8 border-t border-slate-50">
          <div className="flex gap-6">
            <div className="flex items-center gap-2"><Eye size={20} className="text-teal-500"/> <span className="font-black text-xs">{text.views}</span></div>
            <button onClick={handleLike} className={`flex items-center gap-2 ${text.likes?.includes(user?.email) ? 'text-rose-500' : 'text-slate-300'}`}><Heart size={20} fill={text.likes?.includes(user?.email) ? "currentColor" : "none"}/></button>
          </div>
          <span className="text-teal-600 font-black italic">@{text.authorName}</span>
        </div>
      </article>

      <section className="space-y-6">
        <h3 className="text-xl font-black italic flex items-center gap-2"><MessageSquare size={20} className="text-teal-500"/> {text.comments?.length} Échanges</h3>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl">
          <textarea value={newComment} onChange={(e)=>setNewComment(e.target.value)} className="w-full bg-slate-50 rounded-2xl p-6 min-h-[100px] outline-none mb-4" placeholder="Votre ressenti..." />
          <button onClick={handleComment} className="bg-slate-900 text-white px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-teal-600">Envoyer</button>
        </div>
        <div className="space-y-4">
          {[...text.comments].reverse().map((c, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-50 shadow-sm">
              <p className="text-teal-600 font-black text-[10px] uppercase mb-2">{c.userName}</p>
              <p className="text-slate-600">{c.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
