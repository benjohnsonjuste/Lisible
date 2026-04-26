"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; 
import { toast } from "sonner";
import { Loader2, Image as ImageIcon, X, CheckCircle2, PenTool, Type, BookOpen, Sparkles } from "lucide-react";

export default function WorkForm({
  initialData = {},
  isConcours = false,
  isnovelbattle = false, // Nouvelle prop pour le Duel de Nouvelles
  apiEndpoint = "/api/github-db", // Prop pour choisir l'API
  requireBattleAcceptance = false,
  maxChars = null, // Prop pour limiter la longueur du texte
  allowImage = true, // Prop pour autoriser ou non l'image
  submitLabel = "Diffuser",
  onSuccess = null 
}) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState(initialData.title || "");
  const [content, setContent] = useState(initialData.content || "");
  const [category, setCategory] = useState(initialData.category || (isnovelbattle ? "Nouvelle" : (isConcours ? "Battle Poétique" : "Poésie")));
  const [isBattlePoetic, setIsBattlePoetic] = useState(requireBattleAcceptance || false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(initialData.imageBase64 || null);
  const [loading, setLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("lisible_user");
    if (!storedUser) {
      router.push("/login");
      return;
    }
    try {
      const u = JSON.parse(storedUser);
      setUser(u);
    } catch (e) {
      router.push("/login");
    }
    if (!isConcours && !isnovelbattle) {
      const draftTitle = localStorage.getItem("draft_title");
      const draftContent = localStorage.getItem("draft_content");
      if (draftTitle && !title) setTitle(draftTitle);
      if (draftContent && !content) setContent(draftContent);
    }
    setIsChecking(false);
  }, [router, isConcours, isnovelbattle]);

  useEffect(() => {
    if (!isChecking && !isConcours && !isnovelbattle && (title || content)) {
      localStorage.setItem("draft_title", title);
      localStorage.setItem("draft_content", content);
    }
  }, [title, content, isChecking, isConcours, isnovelbattle]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!user?.email) return toast.error("Identité introuvable.");
    if (requireBattleAcceptance && !isBattlePoetic) return toast.error("Veuillez accepter le défi.");
    if (content.trim().length < 50) return toast.error("Le texte est trop court pour être archivé.");
    if (maxChars && content.length > maxChars) return toast.error(`Le texte dépasse la limite de ${maxChars} caractères.`);
    
    setLoading(true);
    const toastId = toast.loading("Scellement et notification des abonnés...");
    
    try {
      let imageBase64 = imagePreview;
      if (imageFile) imageBase64 = await toBase64(imageFile);
      
      const payload = {
        action: "publish",
        title: title.trim(),
        content: content.trim(),
        category,
        authorName: user.penName || user.name || "Plume Anonyme",
        authorEmail: user.email.toLowerCase().trim(),
        imageBase64,
        isConcours: isConcours || isnovelbattle || category === "Battle Poétique",
        isnovelbattle: isnovelbattle || (isConcours && category === "Nouvelle"),
        date: new Date().toISOString()
      };

      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de l'archivage");

      // --- LOGIQUE DE NOTIFICATION ---
      try {
        const usersRes = await fetch(`/api/github-db?type=users`);
        const usersData = await usersRes.json();
        
        if (usersData?.content) {
          const authorProfile = usersData.content.find(u => u.email?.toLowerCase() === user.email.toLowerCase());
          const followers = authorProfile?.followers || [];

          if (followers.length > 0) {
            const newNotification = {
              id: `notif-${Date.now()}`,
              type: (isConcours || isnovelbattle) ? "new_battle" : "new_publication",
              authorName: user.penName || user.name,
              textTitle: title.trim(),
              textId: data.id,
              date: new Date().toISOString(),
              read: false
            };

            await Promise.all(followers.map(async (followerEmail) => {
              const followerProfile = usersData.content.find(u => u.email?.toLowerCase() === followerEmail.toLowerCase());
              if (followerProfile) {
                await fetch("/api/github-db", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    type: "user",
                    id: followerEmail,
                    content: {
                      ...followerProfile,
                      notifications: [newNotification, ...(followerProfile.notifications || [])].slice(0, 20)
                    }
                  })
                });
              }
            }));
          }
        }
      } catch (notifErr) { console.error(notifErr); }

      if (onSuccess) await onSuccess(data.id, title.trim());
      toast.success((isConcours || isnovelbattle) ? "Défi lancé !" : "Œuvre immortalisée ✨", { id: toastId });
      
      if (!isConcours && !isnovelbattle) {
        localStorage.removeItem("draft_title");
        localStorage.removeItem("draft_content");
      }
      router.push(data.id ? `/texts/${data.id}` : "/bibliotheque");
    } catch (err) {
      toast.error(err.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-slate-600" size={40} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ouverture de l'Atelier...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-12 font-sans max-w-4xl mx-auto px-4">
      {requireBattleAcceptance && (
        <div className="flex justify-center animate-in fade-in zoom-in duration-700">
          <div 
            className={`p-10 w-full max-w-md rounded-[2.5rem] border-2 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-4 ${
              isBattlePoetic ? 'border-rose-500 bg-rose-50 shadow-inner' : 'border-slate-100 bg-white hover:border-slate-200'
            }`}
            onClick={() => setIsBattlePoetic(!isBattlePoetic)}
          >
            <div className={`p-4 rounded-2xl ${isBattlePoetic ? 'bg-rose-600 text-white' : 'bg-slate-50 text-slate-300'}`}>
               <CheckCircle2 size={28} />
            </div>
            <p className="text-[11px] font-black uppercase text-slate-900 tracking-[0.2em]">Engager le Duel</p>
          </div>
        </div>
      )}

      <div className="bg-white p-8 md:p-14 rounded-[3.5rem] border border-slate-100 shadow-xl space-y-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[100px] -z-0 opacity-50" />
        <div className="space-y-4 relative z-10">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Type size={14} className="text-slate-400" /> Titre du manuscrit
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Le murmure des encres..."
            required
            className="w-full bg-slate-50 border-none rounded-2xl px-8 py-6 text-3xl font-serif font-black italic outline-none focus:bg-white focus:ring-4 ring-slate-100 transition shadow-inner"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <BookOpen size={14} /> Genre
              </label>
              <select
                value={category}
                disabled={isnovelbattle || isConcours}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl px-8 py-5 font-bold text-slate-600 outline-none focus:bg-white shadow-inner appearance-none cursor-pointer"
              >
                {["Poésie", "Nouvelle", "Roman", "Chronique", "Essai", "Battle Poétique"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <PenTool size={14} /> État du Scribe
              </label>
              <div className="px-8 py-5 bg-slate-50 rounded-2xl text-[11px] font-bold text-slate-700 flex items-center gap-2 border border-slate-100">
                <Sparkles size={14} className="animate-pulse" /> Archivage Direct
              </div>
            </div>
        </div>
        <div className="space-y-4 relative z-10">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <PenTool size={14} /> Corps de l'œuvre
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Laissez votre plume s'évader..."
            required
            className="w-full bg-slate-50 border-none rounded-[2.5rem] p-10 font-serif text-xl leading-relaxed min-h-[500px] outline-none focus:bg-white ring-slate-100 transition shadow-inner resize-none"
          />
          <div className="flex justify-between items-center px-4">
             <span className="text-[9px] font-bold text-slate-300 uppercase italic">Lisible Studio v1.0</span>
             <p className={`text-[9px] font-black uppercase tracking-widest ${maxChars && content.length > maxChars ? 'text-rose-500' : 'text-slate-400'}`}>
               {content.length}{maxChars ? ` / ${maxChars}` : ''} Signes • {content.split(/\s+/).filter(Boolean).length} Mots
             </p>
          </div>
        </div>
      </div>

      {allowImage && (
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-lg space-y-6">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <ImageIcon size={14} /> Couverture du manuscrit
          </label>
          <input type="file" accept="image/*" id="cover" className="hidden" onChange={handleImageChange} />
          {imagePreview ? (
            <div className="relative h-80 rounded-[2.5rem] overflow-hidden shadow-2xl group border-4 border-white">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                  <button type="button" onClick={() => { setImagePreview(null); setImageFile(null); }} className="bg-white text-rose-500 p-5 rounded-full shadow-2xl">
                    <X size={24} />
                  </button>
              </div>
            </div>
          ) : (
            <label htmlFor="cover" className="flex flex-col items-center justify-center p-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] cursor-pointer hover:bg-slate-100 transition-all group">
              <div className="p-6 bg-white rounded-3xl shadow-sm group-hover:scale-110 transition-transform">
                 <ImageIcon size={32} className="text-slate-300" />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400 mt-6 tracking-[0.3em]">Ajouter une illustration (2Mo)</span>
            </label>
          )}
        </div>
      )}

      <div className="pt-6 pb-20">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-950 text-white py-8 rounded-[2.5rem] font-black uppercase tracking-[0.5em] text-[14px] flex justify-center items-center hover:bg-rose-600 transition-all shadow-2xl active:scale-95 disabled:opacity-50"
        >
          {loading ? <div className="flex items-center gap-4"><Loader2 className="animate-spin" size={24} /><span>Scellement...</span></div> : submitLabel}
        </button>
        <p className="text-center text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-8">En archivant, vous contribuez au patrimoine de Lisible.biz</p>
      </div>
    </form>
  );
}
