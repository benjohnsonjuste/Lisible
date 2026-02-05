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
  const [category, setCategory] = useState("Poésie"); // Ajout d'un sélecteur de genre
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
      if (file.size > 2 * 1024 * 1024) return toast.error("Image trop lourde (max 2Mo pour GitHub)");
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
    if (!user) return toast.error("Session expirée.");

    const words = countWords(content);
    if (words > MAX_WORDS) return toast.error(`Trop de mots (${words}/${MAX_WORDS})`);
    if (words < 10) return toast.error("Le manuscrit est trop court.");

    setLoading(true);
    const loadingToast = toast.loading("Publication sur les serveurs Lisible...");

    try {
      let imageBase64 = null;
      if (imageFile) imageBase64 = await toBase64(imageFile);

      const res = await fetch("/api/texts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: user.penName || user.name || "Plume Anonyme",
          authorEmail: user.email?.toLowerCase().trim(),
          title: title.trim(),
          content: content.trim(),
          imageBase64,
          isConcours: false, 
          category: category // On utilise category pour matcher l'API update/delete
        })
      });

      // GESTION DE RÉPONSE AMÉLIORÉE
      const data = await res.json().catch(() => ({ error: "Le serveur a renvoyé une réponse invalide." }));

      if (!res.ok) throw new Error(data.error || "Erreur serveur.");

      // Nettoyage et succès
      localStorage.removeItem("draft_title");
      localStorage.removeItem("draft_content");
      toast.success("Œuvre publiée avec succès !", { id: loadingToast });
      
      router.push(`/texts/${data.id}`);
      
    } catch (err) {
      console.error("Erreur détaillée:", err);
      toast.error(err.message, { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) return (
    <div className="flex h-screen items-center justify-center bg-[#FCFBF9]">
      <Loader2 className="animate-spin text-teal-600" size={40} />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-20 px-5 pt-10 font-sans">
      
      {/* HEADER & BOUTON RETOUR */}
      <div className="flex items-center justify-between">
        <Link href="/bibliotheque" className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-teal-600 transition-all">
          <ArrowLeft size={18} /> Retour Bibliothèque
        </Link>
        <button 
          onClick={() => { if(confirm("Effacer ?")) { setTitle(""); setContent(""); localStorage.clear(); window.location.reload(); }}} 
          className="text-[9px] font-black uppercase tracking-widest text-rose-400 bg-rose-50 px-4 py-2 rounded-xl"
        >
          <Trash2 size={14} className="inline mr-1" /> Corbeille
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 md:p-14 rounded-[4rem] border border-slate-100 shadow-2xl space-y-10">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-slate-950 rounded-2xl text-white shadow-lg">
            <Feather size={26} />
          </div>
          <h1 className="text-4xl font-black italic tracking-tighter">Nouveau Manuscrit</h1>
        </div>

        <div className="space-y-6">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-50 border-2 border-slate-50 rounded-[2rem] px-8 py-6 text-2xl font-black italic outline-none focus:bg-white focus:border-teal-500/20 transition-all"
            placeholder="Titre de l'œuvre..."
            required
          />

          {/* SÉLECTEUR DE CATÉGORIE - IMPORTANT POUR L'INDEX */}
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 font-bold text-sm outline-none focus:bg-white transition-all appearance-none cursor-pointer"
          >
            <option value="Poésie">Poésie</option>
            <option value="Nouvelle">Nouvelle</option>
            <option value="Roman">Roman</option>
            <option value="Chronique">Chronique</option>
            <option value="Essai">Essai</option>
          </select>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-slate-50 border-2 border-slate-50 rounded-[3rem] p-8 font-serif text-xl leading-relaxed min-h-[400px] outline-none focus:bg-white focus:border-teal-500/20 transition-all"
            placeholder="Écrivez ici..."
            required
          />
        </div>

        {/* IMAGE UPLOAD SECTION (Identique à la vôtre) */}
        <div className="relative">
          <input type="file" id="cover" accept="image/*" onChange={handleImageChange} className="hidden" />
          {imagePreview ? (
            <div className="relative rounded-[3rem] overflow-hidden h-60 border-4 border-white shadow-xl">
              <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
              <button type="button" onClick={() => setImagePreview(null)} className="absolute top-4 right-4 bg-rose-500 p-2 rounded-full text-white"><X size={20}/></button>
            </div>
          ) : (
            <label htmlFor="cover" className="flex flex-col items-center justify-center p-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] cursor-pointer hover:bg-teal-50 transition-all">
              <ImageIcon size={30} className="text-slate-300 mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Ajouter une couverture</p>
            </label>
          )}
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-slate-950 text-white py-8 rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.4em] shadow-2xl hover:bg-teal-600 transition-all flex justify-center items-center gap-4 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={24} /> : "Diffuser l'œuvre"}
        </button>
      </form>
    </div>
  );
}
