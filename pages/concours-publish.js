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
      toast.error("Veuillez vous connecter pour participer au concours.");
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
    setConcurrentId(l + n);
    toast.info("ID unique généré !");
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
    if (!isBattlePoetic) return toast.error("Veuillez certifier votre participation.");
    if (!validateConcurrentId(concurrentId)) return toast.error("Format ID requis: ABCD0123");
    
    const wordCount = content.trim().split(/\s+/).length;
    if (wordCount < 20) return toast.error("Votre texte est trop court (min 20 mots).");

    setLoading(true);
    const loadingToast = toast.loading("Transmission à l'Arène...");

    try {
      let imageBase64 = null;
      if (imageFile) imageBase64 = await toBase64(imageFile);

      // --- CRÉATION DE L'ENTRÉE AVEC SYSTÈME LI ---
      const res = await fetch("/api/texts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: concurrentId.toUpperCase(),
          realAuthorEmail: user.email.toLowerCase().trim(),
          authorPenName: user.penName || "Anonyme",
          title: title.trim(),
          content: content.trim(),
          imageBase64,
          isConcours: true,
          concurrentId: concurrentId.toUpperCase(),
          date: new Date().toISOString(),
          // Statistiques Économiques Initiales
          views: 0,
          totalLikes: 0,
          totalCertified: 0, 
          liEarned: 0,
          genre: "Battle Poétique",
          comments: []
        })
      });

      if (!res.ok) throw new Error("Erreur serveur");
      const data = await res.json();

      // Notification Pusher
      await fetch("/api/create-notif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "concours", 
          message: `🏆 BATTLE : Un nouveau concurrent "${title.trim()}" vient de publier !`,
          targetEmail: "all",
          link: `/texts/${data.id}`
        })
      });

      toast.success("Candidature publiée ! Bonne chance poète.", { id: loadingToast });
      router.push(`/texts/${data.id}`);
      
    } catch (err) {
      toast.error("Échec de l'envoi. Vérifiez votre connexion.", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20 px-4 pt-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Link href="/dashboard" className="group inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-teal-600 transition-all">
        <ArrowLeft size={16} /> Dashboard Auteur
      </Link>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-12 rounded-[3.5rem] border-4 border-teal-500/10 shadow-2xl relative overflow-hidden">
        <Sparkles size={180} className="absolute -right-10 -top-10 text-teal-500/5 rotate-12 pointer-events-none" />

        <header className="flex items-center gap-5 mb-10">
          <div className="p-5 bg-slate-900 rounded-[2rem] text-white shadow-xl">
            <Trophy size={32} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-slate-900">Entrer dans l'Arène</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600 mt-2 flex items-center gap-2">
              <Coins size={12}/> Chaque certification vous rapporte 1 Li
            </p>
          </div>
        </header>

        <div className="space-y-6">
          <div 
            onClick={() => setIsBattlePoetic(!isBattlePoetic)}
            className={`p-6 rounded-[2rem] border-2 transition-all cursor-pointer flex items-center justify-between ${isBattlePoetic ? 'border-teal-500 bg-teal-50 shadow-lg shadow-teal-500/10' : 'border-slate-100 bg-slate-50 opacity-60 hover:opacity-100'}`}
          >
            <div className="flex gap-4 items-center">
              <CheckCircle2 className={isBattlePoetic ? "text-teal-600" : "text-slate-300"} />
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-900">Règlement de la Battle</p>
                <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tight">Je certifie mon texte et accepte les votes via Li</p>
              </div>
            </div>
          </div>

          {isBattlePoetic && (
            <div className="animate-in zoom-in-95 duration-300 space-y-3">
              <div className="flex justify-between items-center px-5">
                <label className="text-[10px] font-black uppercase tracking-widest text-teal-600">ID Concurrent Unique</label>
                <button type="button" onClick={generateId} className="text-[9px] font-black uppercase text-slate-400 hover:text-teal-600 flex items-center gap-1 transition-colors">
                   <Wand2 size={12}/> Générer aléatoirement
                </button>
              </div>
              <div className="relative">
                <Hash className={`absolute left-6 top-1/2 -translate-y-1/2 transition-colors ${validateConcurrentId(concurrentId) ? 'text-teal-600' : 'text-slate-300'}`} size={20} />
                <input
                  type="text"
                  maxLength={8}
                  value={concurrentId}
                  onChange={(e) => setConcurrentId(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-6 pl-16 pr-6 text-xl font-black outline-none focus:border-teal-500 transition-all text-slate-900 placeholder:text-slate-200"
                  placeholder="ABCD0123"
                  required
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6 mt-10">
          <div className="space-y-2">
             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-5">Titre de l'œuvre</label>
             <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-6 text-xl italic font-bold outline-none focus:border-teal-200 focus:bg-white transition-all text-slate-900 shadow-inner"
              placeholder="Donnez un nom à votre poème..."
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-5">Le Manuscrit</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-50 rounded-[2.5rem] p-8 font-serif text-lg leading-relaxed min-h-[350px] outline-none focus:border-teal-200 focus:bg-white resize-none transition-all text-slate-800 shadow-inner"
              placeholder="Votre poésie commence ici..."
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
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                <Send size={18} />
                Publier Candidature
              </>
            )}
          </button>
          <p className="text-center text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-6">
            L'ID Concurrent garantit votre anonymat. Votre identité réelle est liée uniquement pour vos gains Li.
          </p>
        </div>
      </form>
    </div>
  );
}
