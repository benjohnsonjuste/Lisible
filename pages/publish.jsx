"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, Send, ArrowLeft, Loader2, Trash2, Trophy, Sparkles, Image as ImageIcon, Coins, X } from "lucide-react"; 
import Link from "next/link";

export default function PublishPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
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
    if (words > MAX_WORDS) return toast.error(`Trop de mots (${words}/${MAX_WORDS})`);
    if (words < 10) return toast.error("Texte trop court.");

    setLoading(true);
    const loadingToast = toast.loading("Impression du manuscrit...");

    try {
      let imageBase64 = null;
      if (imageFile) imageBase64 = await toBase64(imageFile);

      // --- ENVOI VERS L'API CORRIGÉE ---
      const res = await fetch("/api/texts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: user.penName || user.name || "Auteur Lisible",
          authorEmail: user.email.toLowerCase().trim(),
          authorPenName: user.penName || user.name || "Anonyme",
          title: title.trim(),
          content: content.trim(),
          imageBase64,
          isConcours: false, 
          date: new Date().toISOString(),
          views: 0,
          totalLikes: 0,
          totalCertified: 0, 
          liEarned: 0,
          comments: [],
          genre: "Littérature"
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erreur lors de la publication");
      }

      const data = await res.json();

      // Notification communautaire (non bloquante)
      fetch("/api/create-notif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "new_text", 
          message: `📖 Nouvelle œuvre : "${title.trim()}" par ${user.penName || user.name}`,
          targetEmail: "all",
          link: `/texts/${data.id}`
        })
      }).catch(() => {});

      localStorage.removeItem("draft_title");
      localStorage.removeItem("draft_content");

      toast.success("Œuvre diffusée avec succès !", { id: loadingToast });
      router.push(`/texts/${data.id}`);
      
    } catch (err) {
      toast.error(err.message || "Échec de la publication.", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20 px-4 pt-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      <div className="flex items-center justify-between">
        <Link href="/bibliotheque" className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-teal-600 transition-all">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Bibliothèque
        </Link>
        <button 
          onClick={() => { if(confirm("Effacer le brouillon ?")) { setTitle(""); setContent(""); setImageFile(null); setImagePreview(null); localStorage.removeItem("draft_title"); localStorage.removeItem("draft_content"); } }} 
          className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-rose-400 hover:text-rose-600 transition-colors px-4 py-2 bg-rose-50 rounded-xl"
        >
          <Trash2 size={14} /> Corbeille
        </button>
      </div>

      <Link href="/concours-publish" className="block group">
        <div className="bg-slate-900 p-1 rounded-[2.5rem] shadow-2xl shadow-slate-900/20 group-hover:scale-[1.01] transition-all duration-500">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-[2.4rem] p-6 flex items-center justify-between border border-white/5">
            <div className="flex items-center gap-5 text-white">
              <div className="p-4 bg-teal-600 rounded-2xl text-white shadow-lg group-hover:rotate-12 transition-transform">
                <Trophy size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-400 mb-1">Passer en mode Battle</p>
                <h3 className="text-xl font-black italic tracking-tighter leading-none">Concourir pour le Titre</h3>
              </div>
            </div>
            <Sparkles size={20} className="text-amber-400 animate-pulse mr-4" />
          </div>
        </div>
      </Link>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-12 rounded-[3.5rem] space-y-8 border border-slate-100 shadow-2xl relative overflow-hidden">
        <header className="space-y-2 relative">
          <div className="flex items-center gap-4 text-slate-900">
            <div className="p-3 bg-teal-50 rounded-2xl text-teal-600">
                <FileText size={24} />
            </div>
            <h1 className="text-3xl font-black italic tracking-tighter leading-none">Manuscrit</h1>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest pl-16 flex items-center gap-2 text-teal-600">
            <Coins size={12} /> Monétisation Li activée
          </p>
        </header>

        <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 ml-5">Titre</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-6 text-xl italic font-bold outline-none focus:border-teal-100 focus:bg-white transition-all text-slate-900"
                placeholder="Titre de l'œuvre..."
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 ml-5">Corps du texte</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-[2.5rem] p-8 font-serif text-lg leading-relaxed min-h-[400px] outline-none focus:border-teal-100 focus:bg-white resize-none transition-all text-slate-800"
                placeholder="Exprimez-vous..."
                required
              />
              <div className="flex justify-end pr-5">
                <span className={`text-[10px] font-black uppercase ${countWords(content) > MAX_WORDS ? 'text-rose-500' : 'text-slate-300'}`}>
                  {countWords(content)} / {MAX_WORDS} MOTS
                </span>
              </div>
            </div>
        </div>

        <div className="relative group/img">
          <input 
            type="file" 
            id="cover-upload"
            accept="image/*" 
            onChange={handleImageChange} 
            className="hidden" 
          />
          {imagePreview ? (
            <div className="relative rounded-[2.5rem] overflow-hidden group h-64 border-2 border-teal-100 animate-in zoom-in duration-300">
              <img src={imagePreview} className="w-full h-full object-cover" alt="Prévisualisation" />
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <label htmlFor="cover-upload" className="bg-white p-3 rounded-xl cursor-pointer hover:scale-110 transition-transform">
                  <ImageIcon size={20} className="text-teal-600" />
                </label>
                <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="bg-white p-3 rounded-xl hover:scale-110 transition-transform">
                  <X size={20} className="text-rose-500" />
                </button>
              </div>
            </div>
          ) : (
            <label 
              htmlFor="cover-upload"
              className="flex flex-col items-center justify-center p-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] cursor-pointer hover:bg-teal-50 hover:border-teal-200 transition-all group-hover/img:shadow-inner"
            >
              <ImageIcon size={30} className="text-slate-300 mb-2" />
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">
                 Couverture <span className="text-[8px] font-bold opacity-60">(Optionnel)</span>
              </p>
            </label>
          )}
        </div>

        <div className="pt-4">
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-slate-950 text-white py-7 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl hover:bg-teal-600 transition-all flex justify-center items-center gap-3 active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> Publier maintenant</>}
          </button>
        </div>
      </form>
    </div>
  );
}
