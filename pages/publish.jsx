"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImageIcon, Send, ArrowLeft, Info, FileText, Sparkles } from "lucide-react";
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

      const res = await fetch("/api/texts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: user.name,
          title: title.trim(),
          content: content.trim(),
          imageBase64,
          date: new Date().toISOString()
        })
      });

      if (!res.ok) throw new Error("Erreur serveur");
      toast.success("Publication réussie !", { id: loadingToast });
      router.push("/bibliotheque");
    } catch (err) {
      toast.error("Erreur lors de la publication", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Retour et En-tête */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="p-3 bg-white rounded-2xl text-slate-400 hover:text-teal-600 transition-all shadow-sm border border-slate-100">
          <ArrowLeft size={20} />
        </Link>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auteur en ligne</p>
          <p className="text-sm font-bold text-teal-600 italic">{user?.penName || user?.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card-lisible space-y-8 border-none ring-1 ring-slate-100 shadow-xl shadow-slate-200/50">
        <header className="space-y-2">
          <div className="flex items-center gap-3 text-slate-900 mb-1">
            <div className="p-2 bg-slate-900 rounded-lg text-white">
              <FileText size={20} />
            </div>
            <h1 className="text-3xl font-black tracking-tight italic">Nouvelle Publication</h1>
          </div>
          <p className="text-slate-400 text-sm font-medium pl-11">Partagez votre récit avec la communauté.</p>
        </header>

        {/* Rappel des limites stylisé */}
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider">
          <Sparkles size={16} className="text-amber-400 shrink-0" />
          <p>Maximum : <span className="text-slate-700">{MAX_WORDS} mots</span> • Image : <span className="text-slate-700">{MAX_IMAGE_SIZE_MB} MB</span></p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase ml-3 tracking-widest">Titre de l'œuvre</label>
             <input
                type="text"
                placeholder="Donnez un nom à votre texte..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-lisible text-lg italic"
                required
              />
          </div>

          <div className="space-y-2 relative">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-3 tracking-widest">Contenu du texte</label>
            <textarea
              placeholder="Il était une fois..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="input-lisible font-serif text-lg leading-relaxed min-h-[300px] py-6"
              required
            />
            <div className={`absolute bottom-6 right-6 text-[10px] font-black px-3 py-1.5 rounded-xl shadow-sm border ${countWords(content) > MAX_WORDS ? 'bg-red-50 border-red-100 text-red-500' : 'bg-white border-slate-100 text-slate-400'}`}>
              {countWords(content)} / {MAX_WORDS} MOTS
            </div>
          </div>
        </div>

        {/* Upload d'image stylisé */}
        <div className="p-8 bg-teal-50/50 rounded-[2rem] border-2 border-dashed border-teal-100 space-y-4 text-center group hover:bg-teal-50 transition-colors">
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 bg-white rounded-2xl text-teal-600 shadow-sm group-hover:scale-110 transition-transform">
              <ImageIcon size={28} />
            </div>
            <span className="text-xs font-black text-teal-800 uppercase tracking-widest mt-2">Image de couverture</span>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-xs text-slate-500
              file:mr-4 file:py-2 file:px-6
              file:rounded-full file:border-0
              file:text-[10px] file:font-black file:uppercase file:tracking-widest
              file:bg-teal-600 file:text-white
              hover:file:bg-teal-700 file:cursor-pointer"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-lisible w-full py-6 text-lg shadow-xl shadow-teal-100/50 flex gap-3"
        >
          {loading ? (
            <span className="animate-pulse">PUBLICATION EN COURS...</span>
          ) : (
            <>
              <Send size={20} /> PUBLIER SUR LA BIBLIOTHÈQUE
            </>
          )}
        </button>
      </form>

      <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
        Lisible • Protection des droits d'auteur garantie
      </p>
    </div>
  );
}
