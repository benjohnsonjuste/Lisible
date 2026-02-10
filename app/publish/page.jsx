"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Image as ImageIcon,
  X,
  Feather,
  Sparkles
} from "lucide-react";

export default function PublishPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Poésie");
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const categories = ["Poésie", "Nouvelle", "Roman", "Essai", "Chronique"];

  useEffect(() => {
    const loggedUser = localStorage.getItem("lisible_user");
    if (!loggedUser) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(loggedUser));
    
    // Récupération des brouillons si existants
    setTitle(localStorage.getItem("atelier_draft_title") || "");
    setContent(localStorage.getItem("atelier_draft_content") || "");
    setIsChecking(false);
  }, [router]);

  // Sauvegarde automatique des brouillons
  useEffect(() => {
    if (!isChecking) {
      localStorage.setItem("atelier_draft_title", title);
      localStorage.setItem("atelier_draft_content", content);
    }
  }, [title, content, isChecking]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800; 
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // Compression en JPEG pour économiser de l'espace sur le GitHub Data Lake
        setImagePreview(canvas.toDataURL("image/jpeg", 0.6));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const cleanContent = content.trim();
    
    if (!title.trim()) return toast.error("Votre œuvre a besoin d'un titre.");
    if (cleanContent.length === 0) return toast.error("Le Grand Livre ne peut pas sceller une page blanche.");
    if (cleanContent.length > 3000) return toast.error("Ce manuscrit est trop volumineux pour un seul scellé.");

    setLoading(true);
    const toastId = toast.loading("Scellement du manuscrit dans le Data Lake...");

    try {
      const id = Date.now().toString();

      const payload = {
        action: "publish", 
        id,
        title: title.trim(),
        content: cleanContent,
        authorName: user.penName || user.name || "Une Plume",
        authorEmail: user.email.toLowerCase().trim(),
        authorPic: user.profilePic || null,
        genre: category,
        category: category,
        image: imagePreview, 
        isConcours: false,
        date: new Date().toISOString(),
        views: 0,
        likes: 0,
        comments: [],
        certified: 0
      };

      const res = await fetch("/api/github-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Échec de la synchronisation avec le registre.");

      toast.success("Manuscrit scellé avec succès ! ✨", { id: toastId });

      // Nettoyage des brouillons locaux
      localStorage.removeItem("atelier_draft_title");
      localStorage.removeItem("atelier_draft_content");

      router.push(`/texts/${id}`);

    } catch (err) {
      toast.error(err.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) return (
    <div className="h-screen flex items-center justify-center bg-[#FCFBF9]">
      <Loader2 className="animate-spin text-teal-600" size={30} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FCFBF9] pb-32">
      <div className="max-w-3xl mx-auto px-6 pt-12">
        
        <header className="flex items-center justify-between mb-16">
          <button onClick={() => router.back()} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:text-teal-600 transition-all">
            <ArrowLeft size={20} />
          </button>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Sparkles size={12} className="text-teal-600" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-teal-600">Nouvelle Inspiration</span>
            </div>
            <h1 className="font-serif font-black italic text-3xl tracking-tighter text-slate-900">Le Studio.</h1>
          </div>
          <div className="w-12" />
        </header>

        <form onSubmit={handleSubmit} className="space-y-10">
          
          <div className="relative group">
            {imagePreview ? (
              <div className="relative h-72 rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white">
                <img src={imagePreview} className="w-full h-full object-cover" alt="Couverture" />
                <button 
                  type="button"
                  onClick={() => setImagePreview(null)}
                  className="absolute top-6 right-6 p-3 bg-slate-950 text-white rounded-2xl hover:bg-rose-600 transition-colors shadow-lg"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-56 border-2 border-dashed border-slate-200 bg-white rounded-[3rem] cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-all group">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ImageIcon size={28} className="text-slate-300 group-hover:text-teal-500" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Enluminer votre œuvre</span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-7 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                  category === cat 
                  ? "bg-slate-950 border-slate-950 text-white shadow-xl scale-105" 
                  : "bg-white text-slate-400 border-slate-100 hover:border-teal-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="bg-white p-10 md:p-14 rounded-[3.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-10">
            <div className="flex flex-col gap-4 border-b border-slate-50 pb-8">
               <input 
                type="text"
                placeholder="Titre du manuscrit"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-4xl md:text-5xl font-serif font-black italic tracking-tighter outline-none placeholder:text-slate-100 text-slate-900"
              />
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest">Registre de l'Atelier</p>
                <div className={`text-[10px] font-black px-4 py-1.5 rounded-full border transition-colors ${content.length > 2800 ? 'text-rose-500 border-rose-100 bg-rose-50' : 'text-slate-300 border-slate-100'}`}>
                  {content.length.toLocaleString()} caractères
                </div>
              </div>
            </div>
            
            <textarea 
              placeholder="Laissez votre plume glisser sur le parchemin..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[500px] text-xl md:text-2xl font-serif leading-[1.8] outline-none placeholder:text-slate-100 resize-none text-slate-800"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-4 py-7 bg-slate-950 text-white rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.4em] hover:bg-teal-600 transition-all shadow-2xl shadow-slate-900/20 disabled:opacity-50 hover:-translate-y-1 active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <><Feather size={20}/>Publier</>}
          </button>
        </form>
      </div>
    </div>
  );
}
