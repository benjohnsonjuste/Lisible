"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trophy, Send, ArrowLeft, Loader2, CheckCircle2, Hash, FileText } from "lucide-react"; 
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
      setUser(JSON.parse(loggedUser));
    }
  }, [router]);

  const validateConcurrentId = (id) => {
    const regex = /^[A-Z]{4}\d{4}$/;
    return regex.test(id);
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
    
    // SÉCURITÉ : Vérification de la connexion avant traitement
    if (!user) {
      toast.error("Session expirée. Veuillez vous reconnecter.");
      return router.push("/login");
    }
    
    if (!isBattlePoetic) return toast.error("Veuillez certifier votre participation.");
    if (!validateConcurrentId(concurrentId)) {
      return toast.error("Format ID invalide (Exemple requis: ABCD0123)");
    }
    if (content.trim().length < 50) {
      return toast.error("Votre texte est un peu court pour un concours...");
    }

    setLoading(true);
    const loadingToast = toast.loading("Enregistrement de votre candidature...");

    try {
      let imageBase64 = null;
      if (imageFile) imageBase64 = await toBase64(imageFile);

      const res = await fetch("/api/texts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: concurrentId.toUpperCase(),
          realAuthorName: user.penName || user.firstName + " " + user.lastName,
          authorEmail: user.email,
          title: title.trim(),
          content: content.trim(),
          imageBase64,
          isConcours: true,
          concurrentId: concurrentId.toUpperCase(),
          date: new Date().toISOString()
        })
      });

      if (!res.ok) throw new Error("Erreur lors de l'envoi");
      const data = await res.json();

      await fetch("/api/create-notif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "concours", 
          message: `🏆 Nouveau défi : "${title.trim()}" a été déposé par ${concurrentId.toUpperCase()}`,
          targetEmail: "all",
          link: `/texts/${data.id}`
        })
      });

      toast.success("Candidature déposée avec succès !", { id: loadingToast });
      router.push(`/texts/${data.id}`);
      
    } catch (err) {
      toast.error("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null; 

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20 px-4 pt-10">
      <Link href="/dashboard" className="group inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-teal-600 transition-all">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Retour au tableau de bord
      </Link>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-12 rounded-[3.5rem] space-y-8 border-4 border-teal-500/10 shadow-2xl relative overflow-hidden">
        <Trophy size={200} className="absolute -right-10 -top-10 text-teal-500/5 rotate-12 pointer-events-none" />

        <header className="flex items-center gap-5">
          <div className="p-5 bg-teal-600 rounded-[2rem] text-white shadow-xl shadow-teal-500/20">
            <Trophy size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Battle Poétique</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600 mt-2">Dépôt de manuscrit officiel</p>
          </div>
        </header>

        <div className="space-y-4">
          <div 
            onClick={() => setIsBattlePoetic(!isBattlePoetic)}
            className={`p-6 rounded-[2rem] border-2 transition-all cursor-pointer flex items-center justify-between ${isBattlePoetic ? 'border-teal-500 bg-teal-50' : 'border-slate-100 bg-slate-50 opacity-80'}`}
          >
            <div className="flex gap-4 items-center">
              <CheckCircle2 className={isBattlePoetic ? "text-teal-600" : "text-slate-300"} />
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-900">Battle Poétique International</p>
                <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tight">Je confirme ma participation officielle</p>
              </div>
            </div>
          </div>

          {isBattlePoetic && (
            <div className="animate-in slide-in-from-top-4 duration-300">
              <label className="text-[10px] font-black uppercase tracking-widest text-teal-600 ml-5 mb-2 block">
                ID Concurrent Lisible
              </label>
              <div className="relative">
                <Hash className={`absolute left-6 top-1/2 -translate-y-1/2 transition-colors ${validateConcurrentId(concurrentId) ? 'text-teal-600' : 'text-slate-300'}`} size={20} />
                <input
                  type="text"
                  maxLength={8}
                  value={concurrentId}
                  onChange={(e) => setConcurrentId(e.target.value.toUpperCase().replace(/\s/g, ""))}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-6 pl-16 pr-6 text-xl font-black outline-none focus:border-teal-500 transition-all placeholder:text-slate-200"
                  placeholder="EX: POET2026"
                  required
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-5">Titre de l'œuvre</label>
             <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-6 text-xl italic outline-none focus:border-teal-200 focus:bg-white font-bold transition-all"
              placeholder="Saisissez un titre percutant..."
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-5">Corps du poème</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-50 rounded-[2.5rem] p-8 font-serif text-lg leading-relaxed min-h-[400px] outline-none focus:border-teal-200 focus:bg-white resize-none transition-all"
              placeholder="Déposez vos vers ici..."
              required
            />
          </div>
        </div>

        <div className="pt-4">
          <button 
            type="submit" 
            disabled={loading || !isBattlePoetic} 
            className="w-full bg-slate-950 text-white py-7 rounded-2xl font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl hover:bg-teal-600 disabled:opacity-20 transition-all flex justify-center items-center gap-3 active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                <Send size={18} />
                Envoyer au Jury
              </>
            )}
          </button>
          <p className="text-center text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-6">
            En cliquant, vous acceptez le règlement officiel du concours.
          </p>
        </div>
      </form>
    </div>
  );
}
