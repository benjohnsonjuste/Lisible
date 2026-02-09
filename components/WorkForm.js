"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; 
import { toast } from "sonner";
import { Loader2, Image as ImageIcon, X, CheckCircle2, PenTool, Type, BookOpen, Sparkles } from "lucide-react";

export default function WorkForm({
  initialData = {},
  isConcours = false,
  requireBattleAcceptance = false,
  submitLabel = "Diffuser",
}) {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [title, setTitle] = useState(initialData.title || "");
  const [content, setContent] = useState(initialData.content || "");
  const [category, setCategory] = useState(initialData.category || (isConcours ? "Battle Poétique" : "Poésie"));
  const [concurrentId, setConcurrentId] = useState(initialData.concurrentId || "");
  const [isBattlePoetic, setIsBattlePoetic] = useState(requireBattleAcceptance || false);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(initialData.imageBase64 || null);
  const [loading, setLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // ===== Authentification & Gestion des Brouillons =====
  useEffect(() => {
    const storedUser = localStorage.getItem("lisible_user");
    if (!storedUser) {
      router.push("/auth");
      return;
    }
    try {
      const u = JSON.parse(storedUser);
      setUser(u);
    } catch (e) {
      router.push("/auth");
    }

    if (!isConcours) {
      const draftTitle = localStorage.getItem("draft_title");
      const draftContent = localStorage.getItem("draft_content");
      if (draftTitle && !title) setTitle(draftTitle);
      if (draftContent && !content) setContent(draftContent);
    }

    setIsChecking(false);
  }, [router, isConcours]);

  useEffect(() => {
    if (!isChecking && !isConcours && (title || content)) {
      localStorage.setItem("draft_title", title);
      localStorage.setItem("draft_content", content);
    }
  }, [title, content, isChecking, isConcours]);

  // ===== Gestion de l'Image =====
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      return toast.error("Le parchemin est trop lourd (max 2Mo)");
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
    });

  // ===== Soumission =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!user?.email) return toast.error("Identité introuvable.");
    if (requireBattleAcceptance && !isBattlePoetic) return toast.error("Veuillez accepter le duel.");
    if (content.trim().length < 50) return toast.error("Le texte est trop court pour être archivé.");

    setLoading(true);
    const toastId = toast.loading("Scellement du manuscrit...");

    try {
      let imageBase64 = imagePreview;
      if (imageFile) imageBase64 = await toBase64(imageFile);

      const payload = {
        action: "publish", // Action pour l'API unifiée
        title: title.trim(),
        content: content.trim(),
        category,
        authorName: user.penName || user.name || "Plume Anonyme",
        authorEmail: user.email.toLowerCase().trim(),
        imageBase64,
        isConcours: isConcours || category === "Battle Poétique",
        concurrentId: concurrentId?.toUpperCase().trim() || null,
        date: new Date().toISOString()
      };

      // Appel à l'API centralisée github-db
      const res = await fetch("/api/github-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de l'archivage");

      toast.success(isConcours ? "Défi lancé avec succès !" : "Œuvre immortalisée ✨", { id: toastId });

      if (!isConcours) {
        localStorage.removeItem("draft_title");
        localStorage.removeItem("draft_content");
      }

      // Redirection vers le texte ou la bibliothèque
      if (data.id) {
        router.push(`/texts/${data.id}`);
      } else {
        router.push("/bibliotheque");
      }

    } catch (err) {
      toast.error(err.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-teal-600" size={40} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ouverture de l'Atelier...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-12 font-sans max-w-4xl mx-auto px-4">
      
      {/* Duel / Battle */}
      {requireBattleAcceptance && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in duration-700">
          <div 
            className={`p-10 rounded-[2.5rem] border-2 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-4 ${
              isBattlePoetic ? 'border-teal-500 bg-teal-50 shadow-inner' : 'border-slate-100 bg-white hover:border-slate-200'
            }`}
            onClick={() => setIsBattlePoetic(!isBattlePoetic)}
          >
            <div className={`p-4 rounded-2xl ${isBattlePoetic ? 'bg-teal-600 text-white' : 'bg-slate-50 text-slate-300'}`}>
               <CheckCircle2 size={28} />
            </div>
            <p className="text-[11px] font-black uppercase text-slate-900 tracking-[0.2em]">Accepter le Duel</p>
          </div>

          <div className="bg-white p-10 rounded-[2.5rem] border-2 border-slate-100 flex flex-col justify-center gap-4 shadow-sm">
             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">ID du Concurrent</label>
             <input
              type="text"
              value={concurrentId}
              onChange={(e) => setConcurrentId(e.target.value.toUpperCase())}
              placeholder="CODE DUEL"
              className="w-full bg-slate-50 border-none py-4 px-6 rounded-2xl text-2xl font-black outline-none focus:ring-4 ring-teal-500/10 transition-all text-center tracking-[0.3em] placeholder:opacity-20"
            />
          </div>
        </div>
      )}

      {/* Manuscrit */}
      <div className="bg-white p-8 md:p-14 rounded-[3.5rem] border border-slate-100 shadow-xl space-y-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50/50 rounded-bl-[100px] -z-0 opacity-50" />
        
        <div className="space-y-4 relative z-10">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Type size={14} className="text-teal-500" /> Titre du manuscrit
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Le murmure des encres..."
            required
            className="w-full bg-slate-50 border-none rounded-2xl px-8 py-6 text-3xl font-serif font-black italic outline-none focus:bg-white focus:ring-4 ring-teal-500/5 transition shadow-inner"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <BookOpen size={14} className="text-teal-500" /> Genre
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl px-8 py-5 font-bold text-slate-600 outline-none focus:bg-white focus:ring-4 ring-teal-500/5 shadow-inner appearance-none cursor-pointer"
              >
                {["Poésie", "Nouvelle", "Roman", "Chronique", "Essai", "Battle Poétique"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <PenTool size={14} className="text-teal-500" /> État du Scribe
              </label>
              <div className="px-8 py-5 bg-teal-50/50 rounded-2xl text-[11px] font-bold text-teal-700 flex items-center gap-2 border border-teal-100">
                <Sparkles size={14} className="animate-pulse" /> Archivage Direct
              </div>
            </div>
        </div>

        <div className="space-y-4 relative z-10">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <PenTool size={14} className="text-teal-500" /> Corps de l'œuvre
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Laissez votre plume s'évader..."
            required
            className="w-full bg-slate-50 border-none rounded-[2.5rem] p-10 font-serif text-xl leading-relaxed min-h-[500px] outline-none focus:bg-white focus:ring-4 ring-teal-500/5 transition shadow-inner resize-none"
          />
          <div className="flex justify-between items-center px-4">
             <span className="text-[9px] font-bold text-slate-300 uppercase italic">Lisible Studio v1.0</span>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
               {content.length} Signes • {content.split(/\s+/).filter(Boolean).length} Mots
             </p>
          </div>
        </div>
      </div>

      {/* Illustration */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-lg space-y-6">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <ImageIcon size={14} className="text-teal-500" /> Couverture du manuscrit
        </label>
        
        <input type="file" accept="image/*" id="cover" className="hidden" onChange={handleImageChange} />
        
        {imagePreview ? (
          <div className="relative h-80 rounded-[2.5rem] overflow-hidden shadow-2xl group border-4 border-white">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:rotate-1" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                <button 
                  type="button" 
                  onClick={() => { setImagePreview(null); setImageFile(null); }} 
                  className="bg-white text-rose-500 p-5 rounded-full shadow-2xl hover:scale-110 transition-all active:scale-90"
                >
                  <X size={24} />
                </button>
            </div>
          </div>
        ) : (
          <label htmlFor="cover" className="flex flex-col items-center justify-center p-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] cursor-pointer hover:bg-teal-50 hover:border-teal-200 transition-all group">
            <div className="p-6 bg-white rounded-3xl shadow-sm group-hover:scale-110 transition-transform">
               <ImageIcon size={32} className="text-slate-300 group-hover:text-teal-500" />
            </div>
            <span className="text-[10px] font-black uppercase text-slate-400 mt-6 tracking-[0.3em]">Ajouter une illustration (2Mo)</span>
          </label>
        )}
      </div>

      {/* Action */}
      <div className="pt-6 pb-20">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-950 text-white py-8 rounded-[2.5rem] font-black uppercase tracking-[0.5em] text-[14px] flex justify-center items-center hover:bg-teal-600 transition-all shadow-2xl active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <div className="flex items-center gap-4">
              <Loader2 className="animate-spin" size={24} />
              <span>Scellement...</span>
            </div>
          ) : (
            submitLabel
          )}
        </button>
        <p className="text-center text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-8">
          En archivant, vous contribuez au patrimoine de Lisible.biz
        </p>
      </div>
    </form>
  );
}
