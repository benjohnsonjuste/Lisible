"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  FileText, Send, ArrowLeft, Loader2, Trash2, Trophy, 
  Sparkles, Image as ImageIcon, Coins, X, Feather
} from "lucide-react"; 
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
      if (file.size > 4 * 1024 * 1024) return toast.error("Image trop lourde (max 4Mo)");
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
    if (words < 10) return toast.error("Le manuscrit est trop court pour être publié.");

    setLoading(true);
    const loadingToast = toast.loading("Impression et certification du manuscrit...");

    try {
      let imageBase64 = null;
      if (imageFile) imageBase64 = await toBase64(imageFile);

      const res = await fetch("/api/texts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: user.penName || user.name || "Auteur Lisible",
          authorEmail: user.email.toLowerCase().trim(),
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

      // LECTURE SÉCURISÉE DE LA RÉPONSE POUR ÉVITER "RÉPONSE SERVEUR VIDE"
      const responseText = await res.text();
      let data;
      
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        throw new Error("Le serveur a renvoyé une réponse invalide.");
      }

      if (!res.ok) throw new Error(data.error || "Erreur lors de la publication");
      if (!data.id) throw new Error("ID de publication manquant.");

      // Actions secondaires (Non-bloquantes)
      fetch("/api/process-referral-reward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorEmail: user.email.toLowerCase().trim() })
      }).catch(() => {});

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

      toast.success("Votre œuvre est désormais en ligne !", { id: loadingToast });
      router.push(`/texts/${data.id}`);
      
    } catch (err) {
      console.error("Erreur de publication:", err);
      toast.error(err.message || "Échec de la publication.", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) return (
    <div className="flex h-screen items-center justify-center bg-white gap-4 font-sans">
      <Loader2 className="animate-spin text-teal-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Préparation de l'encrier...</p>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-20 px-5 pt-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 font-sans">
      
      <div className="flex items-center justify-between">
        <Link href="/bibliotheque" className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-teal-600 transition-all">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Retour Bibliothèque
        </Link>
        <button 
          type="button"
          onClick={() => { if(confirm("Voulez-vous vraiment effacer votre brouillon ?")) { setTitle(""); setContent(""); setImageFile(null); setImagePreview(null); localStorage.removeItem("draft_title"); localStorage.removeItem("draft_content"); toast.info("Brouillon effacé"); } }} 
          className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-rose-400 hover:text-rose-600 transition-colors px-4 py-2 bg-rose-50 rounded-xl"
        >
          <Trash2 size={14} /> Corbeille
        </button>
      </div>

      <Link href="/concours-publish" className="block group">
        <div className="bg-slate-950 p-1.5 rounded-[2.5rem] shadow-2xl shadow-slate-900/30 group-hover:scale-[1.02] transition-all duration-700 transform-gpu">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-[2.3rem] p-6 flex items-center justify-between border border-white/10">
            <div className="flex items-center gap-6 text-white">
              <div className="p-4 bg-teal-500 rounded-2xl text-white shadow-xl shadow-teal-500/20 group-hover:rotate-[15deg] transition-transform duration-500">
                <Trophy size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-400 mb-1">Défiez les plumes</p>
                <h3 className="text-xl md:text-2xl font-black italic tracking-tighter leading-none">Entrer dans la Battle</h3>
              </div>
            </div>
            <Sparkles size={24} className="text-amber-400 animate-pulse mr-4 hidden sm:block" />
          </div>
        </div>
      </Link>

      <form onSubmit={handleSubmit} className="bg-white p-8 md:p-14 rounded-[4rem] space-y-10 border border-slate-100 shadow-2xl relative">
        <header className="space-y-3 relative">
          <div className="flex items-center gap-5 text-slate-900">
            <div className="p-4 bg-slate-950 rounded-2xl text-white shadow-lg">
                <Feather size={26} />
            </div>
            <div>
                <h1 className="text-4xl font-black italic tracking-tighter leading-none">Manuscrit</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600 mt-2 flex items-center gap-2">
                    <Coins size={12} className="animate-bounce" /> Monétisation Li activée
                </p>
            </div>
          </div>
        </header>

        <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-6">Titre de l'œuvre</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-[2rem] px-8 py-7 text-2xl italic font-black outline-none focus:border-teal-500/10 focus:bg-white transition-all text-slate-900 placeholder:text-slate-200"
                placeholder="Quel est le titre ?"
                required
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-6">L'histoire / Le poème</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-[3rem] p-10 font-serif text-xl leading-relaxed min-h-[500px] outline-none focus:border-teal-500/10 focus:bg-white resize-none transition-all text-slate-800 placeholder:text-slate-200"
                placeholder="Écrivez ici vos plus belles lignes..."
                required
              />
              <div className="flex justify-between items-center px-6">
                <p className="text-[9px] font-bold text-slate-300 italic">Conseil : Relisez-vous avant de publier.</p>
                <span className={`text-[10px] font-black px-4 py-1.5 rounded-full ${countWords(content) > MAX_WORDS ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400'}`}>
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
            <div className="relative rounded-[3rem] overflow-hidden group h-80 border-4 border-white shadow-xl animate-in zoom-in-95 duration-500">
              <img src={imagePreview} className="w-full h-full object-cover" alt="Prévisualisation" />
              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                <label htmlFor="cover-upload" className="bg-white p-4 rounded-2xl cursor-pointer hover:scale-110 active:scale-95 transition-all shadow-xl">
                  <ImageIcon size={22} className="text-teal-600" />
                </label>
                <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="bg-rose-500 p-4 rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-xl">
                  <X size={22} className="text-white" />
                </button>
              </div>
            </div>
          ) : (
            <label 
              htmlFor="cover-upload"
              className="flex flex-col items-center justify-center p-14 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] cursor-pointer hover:bg-teal-50 hover:border-teal-200 hover:text-teal-600 transition-all group-hover/img:shadow-inner"
            >
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                <ImageIcon size={30} className="text-slate-300 group-hover/img:text-teal-500 transition-colors" />
              </div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] text-center">
                 Ajouter une couverture <br/> <span className="text-[8px] font-bold opacity-60 mt-1 block">(Facultatif)</span>
              </p>
            </label>
          )}
        </div>

        <div className="pt-8">
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-slate-950 text-white py-8 rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.4em] shadow-2xl shadow-slate-900/40 hover:bg-teal-600 transition-all flex justify-center items-center gap-4 active:scale-95 disabled:opacity-50 transform-gpu"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : <><Send size={20} className="-rotate-12" /> Diffuser l'œuvre</>}
          </button>
        </div>
      </form>
    </div>
  );
}
