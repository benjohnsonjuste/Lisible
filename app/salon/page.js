"use client";
import React, { useState, useEffect } from 'react';
import { 
  Send, Bell, BellOff, Loader2, User, MessageSquare, 
  ShieldCheck, Sparkles, CheckCircle, Globe 
} from 'lucide-react';
import { toast } from 'sonner';

export default function ForumPage() {
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null);
  const [newMsg, setNewMsg] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const loggedUser = localStorage.getItem("lisible_user");
    if (loggedUser) {
      try { setUser(JSON.parse(loggedUser)); } catch(e) {}
    }
    loadMessages();
  }, []);

  // On vérifie l'abonnement une fois l'utilisateur chargé
  useEffect(() => {
    if (user) checkSubscription();
  }, [user]);

  async function loadMessages() {
    try {
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/forum/messages`);
      if (res.ok) {
        const files = await res.json();
        // On prend les 20 derniers messages pour la performance
        const lastFiles = files.filter(f => f.name.endsWith('.json')).slice(-20);
        const contents = await Promise.all(lastFiles.map(f => fetch(f.download_url).then(r => r.json())));
        setMessages(contents.sort((a, b) => b.id - a.id));
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function checkSubscription() {
    const id = user.email.replace(/[@.]/g, '_');
    const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/forum/subscribers/${id}.json`);
    setIsSubscribed(res.ok);
  }

  const handlePostMessage = async () => {
    if (!newMsg.trim()) return;
    if (!user) return toast.error("Inscrivez-vous pour participer.");

    setIsSending(true);
    const msgId = Date.now();
    const userName = user.name || user.fullName || "Auteur";

    try {
      // 1. Sauvegarde sur GitHub (Base de données du forum)
      // Note: Cette partie nécessite une API route proxy pour le token GitHub (comme ton /api/report)
      // On utilise ici une structure similaire à ton système de report pour la notification
      const resNotify = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        toast.success("Message publié et équipe notifiée !");
        setNewMsg("");
        // Optionnel: Recharger les messages ici
        setTimeout(loadMessages, 1000);
      }
    } catch (error) {
      toast.error("Erreur de transmission.");
    } finally {
      setIsSending(false);
    }
  };

  const toggleSubscription = async () => {
    toast.info("Traitement de l'abonnement...");
    // Logique de création de fichier dans data/forum/subscribers/ via ton API
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

        {user && (
          <button 
            onClick={toggleSubscription}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${
              isSubscribed ? "bg-white text-rose-600 border border-rose-100" : "bg-slate-900 text-white hover:bg-rose-600"
            }`}
          >
            {isSubscribed ? <BellOff size={16}/> : <Bell size={16}/>}
            {isSubscribed ? "Désactiver les alertes" : "S'abonner aux notifications"}
          </button>
        )}
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
                {isSending ? <Loader2 size={18} className="animate-spin" /> : <><Send size={18} /> <span className="text-[10px] font-black uppercase tracking-widest">Publier</span></>}
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
      <div className="space-y-8">
        {loading ? (
          <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-teal-600" size={40} /></div>
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
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-teal-600">Auteur Lisible</p>
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
    </div>
  );
}
