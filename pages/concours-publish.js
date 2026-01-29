"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trophy, Send, ArrowLeft, Loader2, Trash2, CheckCircle2 } from "lucide-react"; 
import Link from "next/link";

export default function ConcoursPublishPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isBattlePoetic, setIsBattlePoetic] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loggedUser = localStorage.getItem("lisible_user");
    if (!loggedUser) {
      router.push("/login"); 
    } else {
      setUser(JSON.parse(loggedUser));
    }
  }, [router]);

  const countWords = (str) => str.trim().split(/\s+/).filter(Boolean).length;

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isBattlePoetic) return toast.error("Veuillez cocher la participation au Battle Poétique.");
    if (countWords(content) > 2000) return toast.error("Trop de mots !");

    setLoading(true);
    const loadingToast = toast.loading("Envoi de votre chef-d'œuvre au jury...");

    try {
      let imageBase64 = null;
      if (imageFile) imageBase64 = await toBase64(imageFile);

      // 1. Publication avec le tag Concours
      const res = await fetch("/api/texts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: user.penName || user.name,
          authorEmail: user.email,
          title: title.trim(),
          content: content.trim(),
          imageBase64,
          isConcours: true, // Tag automatique
          date: new Date().toISOString()
        })
      });

      if (!res.ok) throw new Error("Erreur serveur");
      const data = await res.json();

      // 2. Notification spécifique
      await fetch("/api/create-notif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "concours", 
          message: `🏆 Nouveau candidat au Battle Poétique : "${title.trim()}" par ${user.penName || user.name}`,
          targetEmail: "all",
          link: `/texts/${data.id}`
        })
      });

      toast.success("Candidature enregistrée !", { id: loadingToast });
      router.push(`/texts/${data.id}`);
      
    } catch (err) {
      toast.error("Échec de l'envoi.", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-10 px-4 animate-in fade-in duration-500 pt-10">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-teal-600 transition-all">
        <ArrowLeft size={16} /> Retour au tableau de bord
      </Link>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-12 rounded-[3.5rem] space-y-8 border-4 border-teal-500/20 shadow-2xl relative">
        <header className="space-y-4">
          <div className="flex items-center gap-4 text-slate-900">
            <div className="p-4 bg-gradient-to-br from-teal-500 to-teal-700 rounded-3xl text-white shadow-xl shadow-teal-500/30">
                <Trophy size={32} />
            </div>
            <div>
                <h1 className="text-3xl font-black italic tracking-tighter">BATTLE POÉTIQUE</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600">Édition 2026</p>
            </div>
          </div>
        </header>

        {/* CASE À COCHER CONCOURS */}
        <div 
          onClick={() => setIsBattlePoetic(!isBattlePoetic)}
          className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between ${isBattlePoetic ? 'border-teal-500 bg-teal-50' : 'border-slate-100 bg-slate-50 opacity-60'}`}
        >
          <div className="flex gap-4 items-center">
            <CheckCircle2 className={isBattlePoetic ? "text-teal-600" : "text-slate-300"} />
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-900">Battle Poétique International</p>
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tight">Je certifie l'authenticité de mon œuvre (Max 20 lignes)</p>
            </div>
          </div>
          {isBattlePoetic && <span className="bg-teal-600 text-white text-[9px] font-black px-3 py-1 rounded-full animate-pulse">BADGE CONCOURS ACTIVÉ</span>}
        </div>

        <div className="space-y-6">
             <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl p-6 text-xl italic outline-none focus:ring-2 ring-teal-500/20 font-bold"
                placeholder="Titre de votre poème..."
                required
              />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-[2.5rem] p-8 font-serif text-lg leading-relaxed min-h-[300px] outline-none focus:ring-2 ring-teal-500/20 resize-none"
              placeholder="Écrivez vos vers ici (max 20 lignes)..."
              required
            />
        </div>

        <button type="submit" disabled={loading || !isBattlePoetic} className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl hover:bg-teal-600 disabled:opacity-30 transition-all flex justify-center items-center gap-3">
          {loading ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} /> CONCOURIR </>}
        </button>
      </form>
    </div>
  );
}
