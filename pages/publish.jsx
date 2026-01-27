"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImageIcon, Send, ArrowLeft, FileText, Sparkles, Loader2, Trash2 } from "lucide-react"; 
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
      router.push("/login"); 
    } else {
      setUser(JSON.parse(loggedUser));
      const savedTitle = localStorage.getItem("draft_title");
      const savedContent = localStorage.getItem("draft_content");
      if (savedTitle) setTitle(savedTitle);
      if (savedContent) setContent(savedContent);
      setIsChecking(false);
    }
  }, [router]);

  useEffect(() => {
    if (title) localStorage.setItem("draft_title", title);
    if (content) localStorage.setItem("draft_content", content);
  }, [title, content]);

  const countWords = (str) => str.trim().split(/\s+/).filter(Boolean).length;

  const clearDraft = () => {
    localStorage.removeItem("draft_title");
    localStorage.removeItem("draft_content");
    setTitle("");
    setContent("");
    toast.success("Brouillon effacé");
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
    if (countWords(content) > MAX_WORDS) return toast.error("Trop de mots !");

    setLoading(true);
    const loadingToast = toast.loading("Publication en cours...");

    try {
      let imageBase64 = null;
      if (imageFile) imageBase64 = await toBase64(imageFile);

      // 1. Publication du texte
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

      if (!res.ok) throw new Error("Erreur serveur");
      const publishedText = await res.json();

      // 2. ENVOI DE LA NOTIFICATION GLOBALE
      // On informe tous les utilisateurs qu'une nouvelle œuvre est disponible
      await fetch("/api/create-notif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "global",
          message: `Nouveauté : "${title.trim()}" par ${user.penName || user.name}`,
          targetEmail: "all", // "all" pour envoyer à tout le monde
          link: `/texts/${publishedText.id}`
        })
      });

      // Nettoyage
      localStorage.removeItem("draft_title");
      localStorage.removeItem("draft_content");

      toast.success("Œuvre publiée et communauté notifiée !", { id: loadingToast });
      router.push("/bibliotheque");
    } catch (err) {
      toast.error("Erreur de publication", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-10 px-4 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mt-6">
        <Link href="/dashboard" className="p-3 bg-white rounded-2xl text-slate-400 hover:text-teal-600 shadow-sm border border-slate-100 transition-all">
          <ArrowLeft size={20} />
        </Link>
        <button onClick={clearDraft} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-rose-400 hover:text-rose-600 transition-colors px-4 py-2 bg-rose-50 rounded-xl">
          <Trash2 size={14} /> Effacer le brouillon
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-12 rounded-[3.5rem] space-y-8 border border-slate-50 shadow-2xl relative overflow-hidden">
        {/* Décoration subtile */}
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
            <Sparkles size={120} className="text-teal-600" />
        </div>

        <header className="space-y-2 relative">
          <div className="flex items-center gap-4 text-slate-900">
            <div className="p-3 bg-teal-600 rounded-2xl text-white shadow-lg shadow-teal-600/20">
                <FileText size={24} />
            </div>
            <h1 className="text-3xl font-black italic tracking-tighter">Écrire l'Inspirant</h1>
          </div>
          <p className="text-slate-400 text-sm font-medium ml-1">Le monde attend votre plume.</p>
        </header>

        <div className="space-y-6">
          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase ml-3 tracking-widest">Titre du manuscrit</label>
             <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl p-6 text-xl italic outline-none focus:ring-2 ring-teal-500/20 font-bold transition-all"
                placeholder="Donnez un nom à votre récit..."
                required
              />
          </div>

          <div className="space-y-2 relative">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-3 tracking-widest">Le texte</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-[2.5rem] p-8 font-serif text-lg leading-relaxed min-h-[400px] outline-none focus:ring-2 ring-teal-500/20 resize-none transition-all"
              placeholder="Il était une fois..."
              required
            />
            <div className={`absolute bottom-6 right-6 text-[9px] font-black px-4 py-2 rounded-xl border transition-all ${countWords(content) > MAX_WORDS ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-white border-slate-100 text-slate-400'}`}>
              {countWords(content)} / {MAX_WORDS} MOTS
            </div>
          </div>
        </div>

        {/* Upload Image */}
        <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center group hover:border-teal-400/50 transition-colors">
          <label className="cursor-pointer block">
            <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
                className="hidden"
            />
            <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-400 group-hover:text-teal-600 shadow-sm transition-all">
                    <ImageIcon size={20} />
                </div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    {imageFile ? imageFile.name : "Ajouter une couverture (Optionnel)"}
                </p>
            </div>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl hover:bg-teal-600 active:scale-95 transition-all flex justify-center items-center gap-3 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} /> DIFFUSER DANS LA BIBLIOTHÈQUE</>}
        </button>
      </form>
    </div>
  );
}
