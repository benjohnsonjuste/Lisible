"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  ArrowLeft, Loader2, Trash2, Image as ImageIcon, X, Feather
} from "lucide-react"; 
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
    localStorage.setItem("draft_title", title);
    localStorage.setItem("draft_content", content);
  }, [title, content]);

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
    if (!user?.email) return toast.error("Utilisateur non identifié. Reconnectez-vous.");
    if (content.length < 50) return toast.error("Le texte est trop court pour être publié.");

    setLoading(true);
    const loadingToast = toast.loading("Envoi au serveur...");

    try {
      // Nettoyage strict des données pour l'API
      const payload = {
        title: title.trim() || "Sans titre",
        content: content.trim(),
        authorName: String(user.penName || user.name || "Plume"),
        authorEmail: String(user.email).toLowerCase().trim(),
        category: String(category),
        imageBase64: imagePreview || null, // Sera null si pas d'image
        isConcours: false,
        date: new Date().toISOString()
      };

      const res = await fetch("/api/texts", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      });

      // On vérifie d'abord si c'est du JSON
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
        
        toast.success("Publication réussie !", { id: loadingToast });
        localStorage.removeItem("draft_title");
        localStorage.removeItem("draft_content");
        router.push(`/texts/${data.id}`);
      } else {
        // Si le serveur renvoie du texte brut ou du HTML (erreur 500 crash)
        const errorText = await res.text();
        console.error("Réponse serveur non-JSON:", errorText);
        throw new Error(`Le serveur a crashé (Code ${res.status}). Vérifiez l'API.`);
      }

    } catch (err) {
      console.error("Erreur Publication:", err);
      toast.error(err.message, { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-20 px-5 pt-10 font-sans bg-[#FCFBF9]">
      <div className="flex items-center justify-between">
        <Link href="/bibliotheque" className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <ArrowLeft size={18} /> Retour
        </Link>
        <button onClick={() => {setTitle(""); setContent("");}} className="text-[9px] font-black uppercase text-rose-400">Effacer</button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 md:p-14 rounded-[4rem] border border-slate-100 shadow-2xl space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 rounded-xl text-white"><Feather size={20} /></div>
          <h1 className="text-3xl font-black italic">Publication</h1>
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 text-xl font-bold outline-none focus:border-teal-500/20"
          placeholder="Titre..."
          required
        />

        <select 
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 font-bold"
        >
          {["Poésie", "Nouvelle", "Roman", "Chronique", "Essai"].map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full bg-slate-50 border-2 border-slate-50 rounded-[2rem] p-6 font-serif text-lg min-h-[300px] outline-none"
          placeholder="Votre texte..."
          required
        />

        <div className="relative">
          <input type="file" id="cover" accept="image/*" onChange={handleImageChange} className="hidden" />
          {imagePreview ? (
            <div className="relative h-40 rounded-2xl overflow-hidden border">
              <img src={imagePreview} className="w-full h-full object-cover" alt="" />
              <button type="button" onClick={() => setImagePreview(null)} className="absolute top-2 right-2 bg-rose-500 text-white p-1 rounded-full"><X size={16}/></button>
            </div>
          ) : (
            <label htmlFor="cover" className="flex flex-col items-center p-6 bg-slate-50 border-2 border-dashed rounded-2xl cursor-pointer">
              <ImageIcon className="text-slate-300" />
              <span className="text-[10px] font-black uppercase text-slate-400 mt-2">Couverture (Optionnel)</span>
            </label>
          )}
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-slate-950 text-white py-6 rounded-2xl font-black uppercase tracking-widest hover:bg-teal-600 transition-all flex justify-center items-center gap-4"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : "Publier l'œuvre"}
        </button>
      </form>
    </div>
  );
}
