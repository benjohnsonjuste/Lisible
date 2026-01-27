
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

  // 1. Vérification session + Chargement du brouillon
  useEffect(() => {
    const loggedUser = localStorage.getItem("lisible_user");
    if (!loggedUser) {
      router.push("/login"); 
    } else {
      setUser(JSON.parse(loggedUser));
      
      // Récupérer le brouillon si il existe
      const savedTitle = localStorage.getItem("draft_title");
      const savedContent = localStorage.getItem("draft_content");
      if (savedTitle) setTitle(savedTitle);
      if (savedContent) setContent(savedContent);
      
      setIsChecking(false);
    }
  }, [router]);

  // 2. Sauvegarde automatique à chaque modification
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

      // Effacer le brouillon après succès
      localStorage.removeItem("draft_title");
      localStorage.removeItem("draft_content");

      toast.success("Œuvre publiée !", { id: loadingToast });
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
        <Link href="/dashboard" className="p-3 bg-white rounded-2xl text-slate-400 hover:text-teal-600 shadow-sm border border-slate-100">
          <ArrowLeft size={20} />
        </Link>
        <button onClick={clearDraft} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-rose-400 hover:text-rose-600 transition-colors">
          <Trash2 size={14} /> Effacer le brouillon
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-12 rounded-[3rem] space-y-8 border border-slate-50 shadow-2xl">
        <header className="space-y-2">
          <div className="flex items-center gap-3 text-slate-900">
            <div className="p-2.5 bg-slate-900 rounded-xl text-white"><FileText size={24} /></div>
            <h1 className="text-3xl font-black italic">Nouvelle Publication</h1>
          </div>
          <p className="text-slate-400 text-sm font-medium">Votre texte est sauvegardé automatiquement.</p>
        </header>

        <div className="space-y-6">
          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase ml-3">Titre</label>
             <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl p-5 text-lg italic outline-none focus:ring-2 ring-teal-500/20 font-bold"
                placeholder="Titre..."
                required
              />
          </div>

          <div className="space-y-2 relative">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-3">Récit</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="w-full bg-slate-50 border-none rounded-[2rem] p-8 font-serif text-lg leading-relaxed min-h-[350px] outline-none focus:ring-2 ring-teal-500/20 resize-none"
              placeholder="Écrivez votre histoire..."
              required
            />
            <div className="absolute bottom-6 right-6 text-[10px] font-black px-4 py-2 rounded-xl bg-white border border-slate-100 text-slate-400">
              {countWords(content)} / {MAX_WORDS} MOTS
            </div>
          </div>
        </div>

        {/* Upload Image */}
        <div className="p-8 bg-teal-50/30 rounded-[2.5rem] border-2 border-dashed border-teal-100/50 text-center">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files[0])}
            className="block w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-teal-600 file:text-white"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-xl hover:bg-teal-600 transition-all flex justify-center items-center gap-3"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} /> PUBLIER L'ŒUVRE</>}
        </button>
      </form>
    </div>
  );
}
