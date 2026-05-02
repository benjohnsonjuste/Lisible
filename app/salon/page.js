"use client";
import React, { useState, useEffect } from 'react';
import { 
  Send, Loader2, User, MessageSquare, 
  ShieldCheck, Sparkles, Globe, X
} from 'lucide-react';
import { toast } from 'sonner';
import AdSocialBar from "@/components/AdSocialBar";

export default function ForumPage() {
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [adVisible, setAdVisible] = useState(true);

  useEffect(() => {
    const loggedUser = localStorage.getItem("lisible_user");
    if (loggedUser) {
      try { setUser(JSON.parse(loggedUser)); } catch(e) {}
    }
    loadMessages();
  }, []);

  async function loadMessages() {
    try {
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/forum/messages`);
      if (res.ok) {
        const files = await res.json();
        const lastFiles = files.filter(f => f.name.endsWith('.json')).slice(-20);
        const contents = await Promise.all(lastFiles.map(f => fetch(f.download_url).then(r => r.json())));
        setMessages(contents.sort((a, b) => b.id - a.id));
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const handlePostMessage = async () => {
    if (!newMsg.trim()) return;
    if (!user) return toast.error("Inscrivez-vous pour participer.");

    setIsSending(true);
    const msgId = Date.now();
    const userName = user.name || user.fullName || "Auteur";

    try {
      const resNotify = await fetch("/api/report", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json; charset=UTF-8" 
        },
        body: JSON.stringify({
          reportData: {
            textId: `FORUM-${msgId}`,
            textTitle: `Nouveau message de ${userName}`,
            reporterEmail: user.email,
            reason: "FORUM_POST",
            details: newMsg,
            date: new Date().toLocaleString("fr-FR")
          }
        }),
      });

      if (resNotify.ok) {
        toast.success("Message publié !");
        setNewMsg("");
        setTimeout(loadMessages, 1200);
      }
    } catch (error) {
      toast.error("Erreur de transmission.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-20 bg-[#FCFBF9] min-h-screen">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
        <div>
          <h1 className="text-7xl md:text-8xl font-black italic tracking-tighter text-slate-900 leading-none">Salon Lisible.</h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-4 flex items-center gap-2">
            <Globe size={12} className="text-teal-500" /> Espace de discussion communautaire
          </p>
        </div>
      </header>

      {/* Zone d'écriture */}
      <div className="group bg-white rounded-[2.5rem] p-2 border border-slate-100 shadow-2xl mb-16 transition-all focus-within:border-teal-500/30">
        {user ? (
          <div className="flex flex-col">
            <textarea 
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              placeholder={`Quoi de neuf, ${user.name || "l'ami"} ?`}
              className="w-full p-8 bg-transparent text-lg outline-none resize-none h-32 font-medium text-slate-700 placeholder:text-slate-300"
            />
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-[1.8rem]">
              <div className="flex items-center gap-2 px-4 text-slate-400">
                <ShieldCheck size={16} className="text-teal-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Membre Vérifié</span>
              </div>
              <button 
                onClick={handlePostMessage}
                disabled={isSending || !newMsg.trim()}
                className="bg-slate-900 text-white px-8 py-4 rounded-xl flex items-center gap-3 hover:bg-teal-600 transition-all disabled:opacity-30 shadow-xl"
              >
                {isSending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <Send size={18} /> 
                    <span className="text-[10px] font-black uppercase tracking-widest">Publier</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
            <MessageSquare size={40} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
              Connectez-vous pour rejoindre la conversation
            </p>
          </div>
        )}
      </div>

      {/* Flux de messages */}
      <div className="space-y-8 mb-20">
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="animate-spin mx-auto text-teal-600" size={40} />
          </div>
        ) : messages.length > 0 ? (
          messages.map((m) => (
            <div key={m.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-100 group-hover:bg-teal-500 transition-colors" />
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                    <User size={20} />
                  </div>
                  <div>
                    <h4 className="font-black italic text-slate-900 tracking-tight">{m.author}</h4>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-teal-600">Compte Certifié</p>
                  </div>
                </div>
                <span className="text-[9px] font-mono text-slate-300 bg-slate-50 px-3 py-1 rounded-full">
                  {new Date(m.date || m.id).toLocaleDateString()}
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed text-lg font-medium">{m.text}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
             <Sparkles className="mx-auto text-slate-300 mb-4" />
             <p className="text-slate-400 italic">Soyez le premier à briser le silence...</p>
          </div>
        )}
      </div>

      {/* Remplacement par AdSocialBar */}
      {adVisible && (
        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col items-center">
          <div className="flex items-center justify-between w-full max-w-xl mb-4 px-6">
            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Espace Partenaire</span>
            <button onClick={() => setAdVisible(false)} className="text-slate-300 hover:text-rose-500">
              <X size={12} />
            </button>
          </div>
          <AdSocialBar />
        </div>
      )}
    </div>
  );
}
