"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Trash2, Image as ImageIcon, X, Feather } from "lucide-react"; 
import Link from "next/link";

export default function PublishPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Poésie");
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const loggedUser = localStorage.getItem("lisible_user");
    if (!loggedUser) {
      router.push("/login"); 
    } else {
      setUser(JSON.parse(loggedUser));
      setTitle(localStorage.getItem("draft_title") || "");
      setContent(localStorage.getItem("draft_content") || "");
      setIsChecking(false);
    }
  }, [router]);

  useEffect(() => {
    if (!isChecking) {
      localStorage.setItem("draft_title", title);
      localStorage.setItem("draft_content", content);
    }
  }, [title, content, isChecking]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 600; 
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setImagePreview(canvas.toDataURL("image/jpeg", 0.6));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!user?.email) return toast.error("Utilisateur non identifié.");
    if (content.trim().length < 50) return toast.error("Le texte est trop court (min 50 caractères).");

    setLoading(true);
    const loadingToast = toast.loading("Publication en cours...");

    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        authorName: String(user.penName || user.name || "Plume"),
        authorEmail: String(user.email).toLowerCase().trim(),
        category: String(category),
        imageBase64: imagePreview,
        isConcours: false
      };

      // Utilisation d'un chemin relatif strict pour éviter les redirections 405
      const res = await fetch("/api/texts", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      // Si redirection ou erreur de méthode
      if (res.status === 405) {
        throw new Error("Erreur 405 : L'API refuse la méthode. Vérifiez le fichier api/texts.js");
      }

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Échec de la publication");

        toast.success("Œuvre diffusée avec succès !", { id: loadingToast });
        
        // Nettoyage
        localStorage.removeItem("draft_title");
        localStorage.removeItem("draft_content");
        
        // Redirection vers le texte
        router.push(`/texts/${data.id}`);
      } else {
        const text = await res.text();
        console.error("Réponse brute du serveur:", text);
        throw new Error("Le serveur a renvoyé un format invalide.");
      }

    } catch (err) {
      console.error("Détails de l'erreur:", err);
      toast.error(err.message, { id: loadingToast });
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
    <div className="max-w-3xl mx-auto space-y-10 pb-20 px-5 pt-10 font-sans bg-[#FCFBF9]">
      <div className="flex items-center justify-between">
        <Link href="/bibliotheque" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 hover:text-teal-600 transition-colors">
          <ArrowLeft size={16} /> Retour Bibliothèque
        </Link>
        <button 
          onClick={() => { if(confirm("Vider le brouillon ?")) { setTitle(""); setContent(""); }}} 
          className="text-[9px] font-black uppercase text-rose-400 bg-rose-50 px-3 py-1.5 rounded-lg hover:bg-rose-100 transition-colors"
        >
          Effacer
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 md:p-14 rounded-[3.5rem] border border-slate-100 shadow-2xl space-y-8">
        <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
          <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-lg"><Feather size={22} /></div>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter text-slate-900">Nouveau Manuscrit</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Encre & Lumière</p>
          </div>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-5 text-xl font-black italic outline-none focus:bg-white focus:border-teal-500/20 transition-all text-slate-800"
            placeholder="Titre de votre œuvre..."
            required
          />

          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl px-6 py-4 font-bold text-slate-600 outline-none focus:bg-white focus:border-teal-500/20 appearance-none cursor-pointer"
          >
            {["Poésie", "Nouvelle", "Roman", "Chronique", "Essai"].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-slate-50 border-2 border-slate-50 rounded-[2.5rem] p-8 font-serif text-lg leading-relaxed min-h-[350px] outline-none focus:bg-white focus:border-teal-500/20 transition-all text-slate-700"
            placeholder="Laissez courir votre plume..."
            required
          />
        </div>

        <div className="relative">
          <input type="file" id="cover" accept="image/*" onChange={handleImageChange} className="hidden" />
          {imagePreview ? (
            <div className="relative h-56 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl">
              <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
              <button 
                type="button" 
                onClick={() => setImagePreview(null)} 
                className="absolute top-4 right-4 bg-rose-500/90 backdrop-blur-sm text-white p-2 rounded-full hover:bg-rose-600 transition-colors shadow-lg"
              >
                <X size={18}/>
              </button>
            </div>
          ) : (
            <label htmlFor="cover" className="flex flex-col items-center justify-center p-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] cursor-pointer hover:bg-teal-50/50 hover:border-teal-200 transition-all group">
              <ImageIcon className="text-slate-300 group-hover:text-teal-400 transition-colors" size={32} />
              <span className="text-[10px] font-black uppercase text-slate-400 mt-3 tracking-[0.2em] group-hover:text-teal-600">Couverture (Optionnel)</span>
            </label>
          )}
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-slate-900 text-white py-7 rounded-[2rem] font-black uppercase tracking-[0.4em] text-[11px] shadow-2xl hover:bg-teal-600 active:scale-[0.98] transition-all flex justify-center items-center gap-4 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : "Diffuser dans la Bibliothèque"}
        </button>
      </form>
    </div>
  );
}
