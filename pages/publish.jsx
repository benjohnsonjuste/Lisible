"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
// CORRECTION : On utilise lucide-react (lucide-center n'existe pas)
import { ImageIcon, Send, ArrowLeft, FileText, Sparkles } from "lucide-react"; 
import Link from "next/link";

export default function PublishPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const MAX_IMAGE_SIZE_MB = 2;
  const MAX_WORDS = 2000;

  useEffect(() => {
    const loggedUser = localStorage.getItem("lisible_user");
    if (!loggedUser) {
      toast.error("Veuillez vous connecter.");
      router.push("/login"); 
    } else {
      setUser(JSON.parse(loggedUser));
      setIsChecking(false);
    }
  }, [router]);

  const countWords = (str) => str.trim().split(/\s+/).filter(Boolean).length;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        toast.error(`Image trop lourde (Max ${MAX_IMAGE_SIZE_MB} MB)`);
        e.target.value = null;
        setImageFile(null);
        return;
      }
      setImageFile(file);
    }
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
    const words = countWords(content);

    if (words > MAX_WORDS) {
      return toast.error(`Limite de ${MAX_WORDS} mots dépassée.`);
    }

    setLoading(true);
    const loadingToast = toast.loading("Mise en ligne de votre œuvre...");

    try {
      let imageBase64 = null;
      if (imageFile) imageBase64 = await toBase64(imageFile);

      // 1. Publication du texte sur l'API principale
      const res = await fetch("/api/texts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: user.penName || user.name,
          authorEmail: user.email,
          title: title.trim(),
          content: content.trim(),
          imageBase64,
          date: new Date().toISOString()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error("Erreur lors de la publication sur le serveur.");

      // 2. Notification Globale (Public)
      try {
        await fetch('/api/create-notif', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'new_text',
            message: `${user.penName || user.name} vient de publier : "${title.trim()}"`,
            targetEmail: null, 
            link: `/bibliotheque/${data.id}`
          })
        });
      } catch (nErr) {
        console.error("Erreur notification non bloquante", nErr);
      }

      toast.success("Votre œuvre est en ligne !", { id: loadingToast });
      router.push("/bibliotheque");
    } catch (err) {
      toast.error(err.message || "Erreur lors de la publication", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-10 px-4">
      {/* Header avec Navigation */}
      <div className="flex items-center justify-between mt-6">
        <Link href="/dashboard" className="p-3 bg-white rounded-2xl text-slate-400 hover:text-teal-600 transition-all shadow-sm border border-slate-100 active:scale-95">
          <ArrowLeft size={20} />
        </Link>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plume connectée</p>
          <p className="text-sm font-bold text-teal-600 italic">{user?.penName || user?.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-12 rounded-[3rem] space-y-8 border border-slate-50 shadow-2xl shadow-slate-200/50">
        <header className="space-y-2">
          <div className="flex items-center gap-3 text-slate-900 mb-1">
            <div className="p-2.5 bg-slate-900 rounded-xl text-white">
              <FileText size={24} />
            </div>
            <h1 className="text-3xl font-black tracking-tight italic">Nouvelle Publication</h1>
          </div>
          <p className="text-slate-400 text-sm font-medium pl-1">Donnez vie à vos mots dans la bibliothèque.</p>
        </header>

        {/* Badge de rappel des limites */}
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider">
          <Sparkles size={16} className="text-amber-400 shrink-0" />
          <p>Format : <span className="text-slate-700">{MAX_WORDS} mots max</span> • Couverture : <span className="text-slate-700">{MAX_IMAGE_SIZE_MB} Mo</span></p>
        </div>

        {/* Inputs */}
        <div className="space-y-6">
          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase ml-3 tracking-widest">Titre de l'ouvrage</label>
             <input
                type="text"
                placeholder="Quel est le titre ?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl p-5 text-lg italic outline-none focus:ring-2 ring-teal-500/20 transition-all font-bold placeholder:font-normal"
                required
              />
          </div>

          <div className="space-y-2 relative">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-3 tracking-widest">Récit</label>
            <textarea
              placeholder="Écrivez ici votre histoire..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="w-full bg-slate-50 border-none rounded-[2rem] p-8 font-serif text-lg leading-relaxed min-h-[350px] outline-none focus:ring-2 ring-teal-500/20 transition-all resize-none"
              required
            />
            {/* Compteur de mots dynamique */}
            <div className={`absolute bottom-6 right-6 text-[10px] font-black px-4 py-2 rounded-xl shadow-sm border transition-colors ${countWords(content) > MAX_WORDS ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white border-slate-100 text-slate-400'}`}>
              {countWords(content)} / {MAX_WORDS} MOTS
            </div>
          </div>
        </div>

        {/* Zone Upload d'Image */}
        <div className="p-8 bg-teal-50/30 rounded-[2.5rem] border-2 border-dashed border-teal-100/50 space-y-4 text-center transition-all hover:bg-teal-50/50">
          <div className="flex flex-col items-center gap-2">
            <div className="p-4 bg-white rounded-2xl text-teal-600 shadow-sm transition-transform hover:rotate-3">
              <ImageIcon size={32} />
            </div>
            <span className="text-[11px] font-black text-teal-800 uppercase tracking-widest mt-2">Illustration de couverture</span>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-xs text-slate-400
              file:mr-4 file:py-2.5 file:px-6
              file:rounded-full file:border-0
              file:text-[10px] file:font-black file:uppercase file:tracking-widest
              file:bg-teal-600 file:text-white
              hover:file:bg-teal-700 file:cursor-pointer transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-slate-300 hover:bg-teal-600 active:scale-[0.98] transition-all flex justify-center items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-2 italic">
              <Sparkles className="animate-spin" size={16} /> TRANSMISSION EN COURS...
            </span>
          ) : (
            <>
              <Send size={18} /> PUBLIER DANS LA BIBLIOTHÈQUE
            </>
          )}
        </button>
      </form>

      <footer className="text-center">
        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">
          Lisible par La Belle Littéraire
        </p>
      </footer>
    </div>
  );
}
