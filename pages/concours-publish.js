"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trophy, Send, ArrowLeft, Loader2, CheckCircle2, Hash, Sparkles, Wand2, Coins } from "lucide-react"; 
import Link from "next/link";

export default function ConcoursPublishPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isBattlePoetic, setIsBattlePoetic] = useState(false);
  const [concurrentId, setConcurrentId] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loggedUser = localStorage.getItem("lisible_user");
    if (!loggedUser) {
      toast.error("Veuillez vous connecter pour participer.");
      router.push("/login"); 
    } else {
      const parsed = JSON.parse(loggedUser);
      setUser(parsed);
      if (parsed.concurrentId) setConcurrentId(parsed.concurrentId);
    }
  }, [router]);

  const validateConcurrentId = (id) => {
    const regex = /^[A-Z]{4}\d{4}$/;
    return regex.test(id);
  };

  const generateId = () => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const l = Array(4).fill(0).map(() => letters[Math.floor(Math.random() * 26)]).join("");
    const n = Math.floor(1000 + Math.random() * 9000);
    const newId = l + n;
    setConcurrentId(newId);
    toast.info(`ID généré : ${newId}`);
  };

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return router.push("/login");
    if (!isBattlePoetic) return toast.error("Certifiez votre participation.");
    if (!validateConcurrentId(concurrentId)) return toast.error("Format ID requis : ABCD0123");
    
    const wordCount = content.trim().split(/\s+/).length;
    if (wordCount < 10) return toast.error("Texte trop court.");

    setLoading(true);
    const loadingToast = toast.loading("Publication en cours...");

    try {
      let imageBase64 = null;
      if (imageFile) imageBase64 = await toBase64(imageFile);

      // --- PUBLICATION (DÉCLENCHE LES NOTIFS ABONNÉS VIA API/TEXTS) ---
      const res = await fetch("/api/texts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: concurrentId.toUpperCase(),
          authorEmail: user.email.toLowerCase().trim(),
          authorPenName: user.penName || user.name || "Anonyme",
          title: title.trim(),
          content: content.trim(),
          imageBase64,
          isConcours: true,
          concurrentId: concurrentId.toUpperCase(),
          date: new Date().toISOString(),
          views: 0,
          totalLikes: 0,
          totalCertified: 0, 
          liEarned: 0,
          genre: "Battle Poétique",
          comments: []
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erreur serveur");
      }
      
      const data = await res.json();

      // Notification globale corrigée vers /texte/
      fetch("/api/create-notif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "concours", 
          message: `🏆 BATTLE : Un nouveau poème "${title.trim()}" est en ligne !`,
          targetEmail: "all",
          link: `/texte/${data.id}`
        })
      }).catch(e => console.error("Notification non envoyée"));

      toast.success("Candidature publiée !", { id: loadingToast });
      router.push(`/texte/${data.id}`);
      
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Échec de l'envoi. Réessayez.", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20 px-4 pt-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Link href="/bibliotheque" className="group inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-teal-600 transition-all">
        <ArrowLeft size={16} /> Retour Bibliothèque
      </Link>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-12 rounded-[3.5rem] border-4 border-teal-500/10 shadow-2xl relative overflow-hidden">
        <Sparkles size={180} className="absolute -right-10 -top-10 text-teal-500/5 rotate-12 pointer-events-none" />

        <header className="flex items-center gap-5 mb-10">
          <div className="p-5 bg-slate-900 rounded-[2rem] text-white shadow-xl">
            <Trophy size={32} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-slate-900">Arène Poétique</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600 mt-2 flex items-center gap-2">
              <Coins size={12}/> Chaque certification rapporte des Li
            </p>
          </div>
        </header>

        <div className="space-y-6">
          <div 
            onClick={() => setIsBattlePoetic(!isBattlePoetic)}
            className={`p-6 rounded-[2rem] border-2 transition-all cursor-pointer flex items-center justify-between ${isBattlePoetic ? 'border-teal-500 bg-teal-50' : 'border-slate-100 bg-slate-50 opacity-60'}`}
          >
            <div className="flex gap-4 items-center">
              <CheckCircle2 className={isBattlePoetic ? "text-teal-600" : "text-slate-300"} />
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-900">Règlement Battle</p>
                <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tight">Certification Li activée</p>
              </div>
            </div>
          </div>

          {isBattlePoetic && (
            <div className="animate-in zoom-in-95 duration-300 space-y-3">
              <div className="flex justify-between items-center px-5">
                <label className="text-[10px] font-black uppercase tracking-widest text-teal-600">ID Concurrent Unique</label>
                <button type="button" onClick={generateId} className="text-[9px] font-black uppercase text-slate-400 hover:text-teal-600 flex items-center gap-1 transition-colors">
                   <Wand2 size={12}/> ID Aléatoire
                </button>
              </div>
              <div className="relative">
                <Hash className={`absolute left-6 top-1/2 -translate-y-1/2 ${validateConcurrentId(concurrentId) ? 'text-teal-600' : 'text-slate-300'}`} size={20} />
                <input
                  type="text"
                  maxLength={8}
                  value={concurrentId}
                  onChange={(e) => setConcurrentId(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-6 pl-16 pr-6 text-xl font-black outline-none focus:border-teal-500 transition-all text-slate-900"
                  placeholder="ABCD0123"
                  required
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6 mt-10">
          <div className="space-y-2">
             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-5">Titre du manuscrit</label>
             <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-6 text-xl italic font-bold outline-none focus:border-teal-200 transition-all shadow-inner"
              placeholder="Nom de l'œuvre..."
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-5">Contenu Poétique</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-50 rounded-[2.5rem] p-8 font-serif text-lg leading-relaxed min-h-[350px] outline-none focus:border-teal-200 transition-all text-slate-800 shadow-inner"
              placeholder="Écrivez votre texte..."
              required
            />
          </div>
        </div>

        <div className="pt-10">
          <button 
            type="submit" 
            disabled={loading || !isBattlePoetic} 
            className="w-full bg-slate-950 text-white py-7 rounded-[1.8rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl hover:bg-teal-600 disabled:opacity-20 transition-all flex justify-center items-center gap-3 active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> Lancer la publication</>}
          </button>
        </div>
      </form>
    </div>
  );
}
