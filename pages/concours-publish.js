"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trophy, Send, ArrowLeft, Loader2, CheckCircle2, Hash, Sparkles, Wand2, Coins, Flame } from "lucide-react"; 
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
      toast.error("Veuillez vous connecter pour entrer dans l'arène.");
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
    toast.info(`ID Concurrent généré : ${newId}`);
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
    if (!isBattlePoetic) return toast.error("Vous devez certifier votre participation au règlement.");
    if (!validateConcurrentId(concurrentId)) return toast.error("Format ID requis : 4 lettres + 4 chiffres (ex: PLUM1234)");
    
    const wordCount = content.trim().split(/\s+/).length;
    if (wordCount < 10) return toast.error("Le texte est trop court pour un duel.");

    setLoading(true);
    const loadingToast = toast.loading("Transmission de votre candidature à l'Arène...");

    try {
      let imageBase64 = null;
      if (imageFile) imageBase64 = await toBase64(imageFile);

      const res = await fetch("/api/texts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: concurrentId.toUpperCase(),
          authorEmail: user.email.toLowerCase().trim(),
          authorPenName: user.penName || user.name || "Concurrent Anonyme",
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
        throw new Error(errorData.error || "Erreur serveur lors de la publication");
      }
      
      const data = await res.json();

      fetch("/api/create-notif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "concours", 
          message: `🏆 BATTLE : Le gladiateur ${concurrentId} vient de publier "${title.trim()}" !`,
          targetEmail: "all",
          link: `/texts/${data.id}`
        })
      }).catch(() => {});

      toast.success("Duel engagé ! Votre poème est dans l'arène.", { id: loadingToast });
      router.push(`/texts/${data.id}`);
      
    } catch (err) {
      toast.error(err.message || "Échec de l'envoi.", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 px-5 pt-10 animate-in fade-in slide-in-from-bottom-10 duration-1000 font-sans">
      <Link href="/bibliotheque" className="group inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-teal-600 transition-all">
        <ArrowLeft size={16} /> Retour Bibliothèque
      </Link>

      <div className="relative bg-slate-950 p-8 md:p-14 rounded-[4rem] border border-white/10 shadow-3xl overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12">
            <Flame size={200} className="text-teal-500" />
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 space-y-10">
          <header className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
            <div className="p-6 bg-teal-500 rounded-[2.5rem] text-white shadow-2xl shadow-teal-500/30 animate-pulse">
              <Trophy size={40} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-none text-white font-sans">Arène Poétique</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-teal-400 mt-3 flex items-center justify-center md:justify-start gap-2">
                <Sparkles size={12}/> Gloire & Certification Li active
              </p>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div 
              onClick={() => setIsBattlePoetic(!isBattlePoetic)}
              className={`p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer flex flex-col justify-between gap-4 ${isBattlePoetic ? 'border-teal-500 bg-teal-500/10 shadow-lg' : 'border-white/5 bg-white/5 opacity-50'}`}
            >
              <CheckCircle2 className={isBattlePoetic ? "text-teal-400" : "text-slate-600"} size={28} />
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-white">Règlement de Duel</p>
                <p className="text-[9px] text-slate-400 uppercase font-bold tracking-tight mt-1">J'accepte les conditions de la Battle</p>
              </div>
            </div>

            <div className={`p-8 rounded-[2.5rem] border-2 transition-all ${isBattlePoetic ? 'border-white/10 bg-white/5' : 'border-white/5 bg-white/5 opacity-20 pointer-events-none'}`}>
              <div className="flex justify-between items-center mb-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-teal-400">Identifiant Unique</label>
                <button type="button" onClick={generateId} className="text-[9px] font-black uppercase text-slate-500 hover:text-white flex items-center gap-1 transition-colors">
                   <Wand2 size={12}/> Aléatoire
                </button>
              </div>
              <div className="relative">
                <Hash className="absolute left-0 top-1/2 -translate-y-1/2 text-teal-500" size={20} />
                <input
                  type="text"
                  maxLength={8}
                  value={concurrentId}
                  onChange={(e) => setConcurrentId(e.target.value.toUpperCase())}
                  className="w-full bg-transparent border-b-2 border-white/10 py-2 pl-8 text-2xl font-black outline-none focus:border-teal-500 transition-all text-white placeholder:text-white/5"
                  placeholder="ABCD0123"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-8 bg-white/5 p-8 md:p-12 rounded-[3.5rem] border border-white/5 shadow-inner">
            <div className="space-y-3">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Titre du manuscrit de guerre</label>
               <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent border-b-2 border-white/10 py-4 text-3xl italic font-black outline-none focus:border-teal-500 transition-all text-white placeholder:text-white/5"
                placeholder="Le Cri du Silence..."
                required
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Vers Poétiques</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-white/5 border-2 border-white/5 rounded-[2.5rem] p-8 font-serif text-xl leading-relaxed min-h-[400px] outline-none focus:border-teal-500/30 transition-all text-slate-200 shadow-inner resize-none"
                placeholder="Laissez votre plume terrasser l'adversaire..."
                required
              />
            </div>
          </div>

          <div className="pt-6">
            <button 
              type="submit" 
              disabled={loading || !isBattlePoetic} 
              className="w-full bg-teal-500 text-slate-950 py-8 rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.5em] shadow-2xl shadow-teal-500/20 hover:bg-white transition-all disabled:opacity-10 flex justify-center items-center gap-4 active:scale-95 transform-gpu"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : <><Send size={22} className="-rotate-12" /> Entrer dans l'Arène</>}
            </button>
            <p className="text-center mt-6 text-[8px] font-black uppercase tracking-[0.4em] text-slate-600">
              Chaque mot compte. La victoire se mérite par le sang de l'encre.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
