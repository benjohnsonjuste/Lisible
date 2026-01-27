"use client";
import { useEffect, useState } from "react";
import { Heart, Share2, Send, MessageCircle, Eye, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function Detail({ params }) {
  const [item, setItem] = useState(null);
  const [comment, setComment] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const logged = localStorage.getItem("lisible_user");
    if (logged) setUser(JSON.parse(logged));

    async function load() {
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications/${params.id}.json?t=${Date.now()}`);
      const file = await res.json();
      const content = JSON.parse(atob(file.content));
      setItem(content);
      // Compteur de vue automatique
      fetch("/api/texts", { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ id: params.id, action: "view" })});
    }
    load();
  }, [params.id]);

  const handleLike = async () => {
    if (!user) return toast.error("Connectez-vous !");
    const res = await fetch("/api/texts", {
      method: "PATCH",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ id: params.id, action: "like", payload: { email: user.email }})
    });
    if (res.ok) {
        const updated = await res.json();
        setItem(updated);
        toast.success("Action enregistrée");
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    const res = await fetch("/api/texts", {
      method: "PATCH",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ id: params.id, action: "comment", payload: { userName: user.penName || user.name, text: comment }})
    });
    if (res.ok) {
        setItem(await res.json());
        setComment("");
        toast.success("Commentaire publié");
    }
  };

  if (!item) return <div className="text-center py-40 font-black animate-pulse">OUVERTURE DU MANUSCRIT...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">
      <Link href="/bibliotheque" className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest"><ArrowLeft size={16}/> Bibliothèque</Link>
      
      <article className="bg-white rounded-[3rem] shadow-2xl border border-slate-50 overflow-hidden">
        {item.imageBase64 && <img src={item.imageBase64} className="w-full h-80 object-cover" />}
        <div className="p-8 md:p-14 space-y-8">
          <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter">{item.title}</h1>
          <div className="flex justify-between items-center py-6 border-y border-slate-50">
            <span className="text-teal-600 font-black italic">@{item.authorName}</span>
            <div className="flex gap-4 text-slate-400 font-bold text-xs">
              <span className="flex items-center gap-1"><Eye size={18}/> {item.views}</span>
              <button onClick={handleLike} className={`flex items-center gap-1 transition-transform active:scale-150 ${item.likes?.includes(user?.email) ? 'text-rose-500' : ''}`}><Heart size={18} fill={item.likes?.includes(user?.email) ? "currentColor" : "none"}/></button>
            </div>
          </div>
          <div className="font-serif text-xl leading-relaxed text-slate-700 whitespace-pre-line">{item.content}</div>
          <button onClick={() => window.open(`https://wa.me/?text=Lis ce texte sur Lisible : ${window.location.href}`)} className="w-full py-5 bg-[#25D366] text-white rounded-[1.5rem] font-black flex justify-center items-center gap-3 shadow-lg"><Share2 size={20}/> PARTAGER SUR WHATSAPP</button>
        </div>
      </article>

      <section className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white">
        <h3 className="text-xl font-black italic mb-8 flex items-center gap-3"><MessageCircle className="text-teal-400" /> {item.comments?.length} Commentaires</h3>
        <div className="space-y-6 mb-8">
          {item.comments?.map((c, i) => (
            <div key={i} className="bg-white/5 p-6 rounded-2xl border border-white/10">
              <p className="text-teal-400 font-black text-[10px] uppercase mb-1">{c.userName}</p>
              <p className="text-slate-300">{c.text}</p>
            </div>
          ))}
        </div>
        {user ? (
          <div className="relative">
            <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Votre avis..." className="w-full bg-white/10 border-none rounded-2xl p-5 outline-none focus:ring-2 ring-teal-500 pr-16 text-white"/>
            <button onClick={handleComment} className="absolute right-3 top-3 p-3 bg-teal-500 rounded-xl"><Send size={20} /></button>
          </div>
        ) : <p className="text-center text-slate-500 italic">Connectez-vous pour commenter.</p>}
      </section>
    </div>
  );
}
