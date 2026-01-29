"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trophy, Send, ArrowLeft, Loader2, CheckCircle2, Hash } from "lucide-react"; 
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
    
    if (!isBattlePoetic) return toast.error("Veuillez cocher la participation au Battle Poétique.");
    if (!validateConcurrentId(concurrentId)) {
      return toast.error("Format ID invalide (Ex: ABCD0123)");
    }

    setLoading(true);
    const loadingToast = toast.loading("Transmission de votre œuvre...");

    try {
      let imageBase64 = null;
      if (imageFile) imageBase64 = await toBase64(imageFile);

      const res = await fetch("/api/texts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Pour le concours, on utilise l'ID Concurrent comme nom d'affichage
          authorName: concurrentId.toUpperCase(),
          realAuthorName: user.penName || user.name,
          authorEmail: user.email,
          title: title.trim(),
          content: content.trim(),
          imageBase64,
          isConcours: true,
          concurrentId: concurrentId.toUpperCase(),
          date: new Date().toISOString()
        })
      });

      if (!res.ok) throw new Error("Erreur serveur");
      const data = await res.json();

      await fetch("/api/create-notif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "concours", 
          message: `🏆 Nouveau poème en lice : "${title.trim()}" par ${concurrentId.toUpperCase()}`,
          targetEmail: "all",
          link: `/texts/${data.id}`
        })
      });

      toast.success("Candidature validée !", { id: loadingToast });
      router.push(`/texts/${data.id}`);
      
    } catch (err) {
      toast.error("Échec de l'envoi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-10 px-4 animate-in fade-in duration-500 pt-10">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-teal-600 transition-all">
        <ArrowLeft size={16} /> Tableau de bord
      </Link>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-12 rounded-[3.5rem] space-y-8 border-4 border-teal-500/20 shadow-2xl relative">
        <header className="flex items-center gap-4 text-slate-900">
          <div className="p-4 bg-teal-600 rounded-3xl text-white shadow-xl shadow-teal-500/30">
            <Trophy size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase">Battle Poétique</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600">Inscription Officielle</p>
          </div>
        </header>

        <div 
          onClick={() => setIsBattlePoetic(!isBattlePoetic)}
          className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between ${isBattlePoetic ? 'border-teal-500 bg-teal-50' : 'border-slate-100 bg-slate-50 opacity-60'}`}
        >
          <div className="flex gap-4 items-center">
            <CheckCircle2 className={isBattlePoetic ? "text-teal-600" : "text-slate-300"} />
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-900">Battle Poétique International</p>
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tight">Je certifie l'authenticité de mon œuvre</p>
            </div>
          </div>
        </div>

        {isBattlePoetic && (
          <div className="space-y-4 animate-in zoom-in duration-300">
            <label className="text-[10px] font-black uppercase tracking-widest text-teal-600 ml-4">Votre ID Concurrent (Format: ABCD0123)</label>
            <div className="relative">
              <Hash className="absolute left-6 top-1/2 -translate-y-1/2 text-teal-500" size={20} />
              <input
                type="text"
                maxLength={8}
                value={concurrentId}
                onChange={(e) => setConcurrentId(e.target.value.toUpperCase())}
                className="w-full bg-teal-50 border-2 border-teal-100 rounded-2xl py-6 pl-16 pr-6 text-xl font-black outline-none focus:border-teal-500 transition-all placeholder:text-teal-200"
                placeholder="EX: POET2026"
                required
              />
            </div>
          </div>
        )}

        <div className="space-y-6">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-2xl p-6 text-xl italic outline-none focus:ring-2 ring-teal-500/20 font-bold transition-all"
            placeholder="Titre de votre poème..."
            required
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-[2.5rem] p-8 font-serif text-lg leading-relaxed min-h-[300px] outline-none focus:ring-2 ring-teal-500/20 resize-none transition-all"
            placeholder="Écrivez vos vers ici..."
            required
          />
        </div>

        <button type="submit" disabled={loading || !isBattlePoetic} className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl hover:bg-teal-600 disabled:opacity-30 transition-all flex justify-center items-center gap-3">
          {loading ? <Loader2 className="animate-spin" size={18} /> : "CONCOURIR"}
        </button>
      </form>
    </div>
  );
}
