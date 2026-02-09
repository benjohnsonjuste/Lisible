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

  const categories = ["Poésie", "Nouvelle", "Roman", "Essai", "Article"];

  useEffect(() => {
    const loggedUser = localStorage.getItem("lisible_user");
    if (!loggedUser) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(loggedUser));
    setTitle(localStorage.getItem("draft_title") || "");
    setContent(localStorage.getItem("draft_content") || "");
    setIsChecking(false);
  }, [router]);

  useEffect(() => {
    if (!isChecking) {
      localStorage.setItem("draft_title", title);
      localStorage.setItem("draft_content", content);
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
        setImagePreview(canvas.toDataURL("image/jpeg", 0.5));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    // VALIDATION : Pas de minimum, mais maximum 1000
    const cleanContent = content.trim();
    
    if (cleanContent.length === 0) {
      return toast.error("Le Grand Livre ne peut pas publier de page blanche.");
    }

    if (cleanContent.length > 1000) {
      return toast.error(`Votre texte est trop long (${cleanContent.length}/1000). Soyez plus concis.`);
    }

    if (!title.trim()) {
      return toast.error("Veuillez donner un titre à votre œuvre.");
    }

    setLoading(true);
    const toastId = toast.loading("Action...");

    try {
      const id = Date.now().toString();

      const payload = {
        id,
        title: title.trim(),
        content: cleanContent,
        authorName: user.penName || user.name || "Plume",
        authorEmail: user.email.toLowerCase().trim(),
        authorPic: user.profilePic || null,
        genre: category,
        category: category,
        imageBase64: imagePreview,
        isConcours: false,
        date: new Date().toISOString(),
        views: 0,
        totalLikes: 0,
        comments: [],
        totalCertified: 0 // Initialisation pour le sceau
      };

      const res = await fetch("/api/github-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur de communication avec GitHub");
      }

      toast.success("Œuvre publiée avec succès ! ", { id: toastId });

      localStorage.removeItem("draft_title");
      localStorage.removeItem("draft_content");

      router.push(`/texts/${id}`);

    } catch (err) {
      console.error(err);
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
    <div className="min-h-screen bg-[#FCFBF9] pb-20 font-sans">
      <div className="max-w-3xl mx-auto px-6 pt-10">
        
        <header className="flex items-center justify-between mb-12">
          <button onClick={() => router.back()} className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm hover:text-teal-600 transition-all">
            <ArrowLeft size={20} />
          </button>
          <div className="text-center">
            <h1 className="font-serif font-black italic text-2xl tracking-tighter">Écrire une œuvre</h1>
          </div>
          <div className="w-10" />
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="relative group">
            {imagePreview ? (
              <div className="relative h-64 rounded-[2.5rem] overflow-hidden shadow-xl border-4 border-white">
                <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                <button 
                  type="button"
                  onClick={() => setImagePreview(null)}
                  className="absolute top-4 right-4 p-2 bg-rose-500 text-white rounded-full hover:scale-110 transition-transform"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-200 bg-white rounded-[2.5rem] cursor-pointer hover:border-teal-400 hover:bg-teal-50/50 transition-all">
                <ImageIcon size={32} className="text-slate-300 mb-2" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ajouter une couverture</span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  category === cat 
                  ? "bg-teal-600 text-white shadow-lg" 
                  : "bg-white text-slate-400 border border-slate-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 pb-4">
               <input 
                type="text"
                placeholder="Titre de l'œuvre"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-3xl font-serif font-black italic tracking-tighter outline-none placeholder:text-slate-200"
              />
              <div className={`text-[10px] font-black px-3 py-1.5 rounded-full border transition-colors ${content.length > 1000 ? 'text-rose-500 border-rose-100 bg-rose-50' : 'text-slate-300 border-slate-100'}`}>
                {content.length} / 1000
              </div>
            </div>
            
            <textarea 
              placeholder="Laissez parler votre plume... (Max 1000 caractères)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[450px] text-lg font-serif leading-relaxed outline-none placeholder:text-slate-200 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-4 py-6 bg-slate-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] hover:bg-teal-600 transition-all shadow-xl disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <><Feather size={18}/> Publier</>}
          </button>
        </form>
      </div>
    </div>
  );
}
