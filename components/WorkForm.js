"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; 
import { toast } from "sonner";
import { Loader2, Image as ImageIcon, X, CheckCircle2 } from "lucide-react";

export default function WorkForm({
  initialData = {},
  isConcours = false,
  requireBattleAcceptance = false,
  submitLabel = "Diffuser",
  onSubmitApi = "/api/texts", // Assure-toi que cette route existe
}) {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [title, setTitle] = useState(initialData.title || "");
  const [content, setContent] = useState(initialData.content || "");
  const [category, setCategory] = useState(initialData.category || "Poésie");
  const [concurrentId, setConcurrentId] = useState(initialData.concurrentId || "");
  const [isBattlePoetic, setIsBattlePoetic] = useState(requireBattleAcceptance || false);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(initialData.imageBase64 || null);
  const [loading, setLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // ===== Auth + Draft =====
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
      console.error("Erreur parsing user:", e);
      router.push("/login");
    }

    if (!isConcours) {
      setTitle(localStorage.getItem("draft_title") || title);
      setContent(localStorage.getItem("draft_content") || content);
    }

    setIsChecking(false);
  }, [router, isConcours]);

  useEffect(() => {
    if (!isChecking && !isConcours) {
      localStorage.setItem("draft_title", title);
      localStorage.setItem("draft_content", content);
    }
  }, [title, content, isChecking, isConcours]);

  // ===== Image Handler =====
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      return toast.error("Image trop lourde (max 2Mo)");
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

  // ===== Submit Handler Corrigé =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!user?.email) return toast.error("Utilisateur non identifié.");
    if (requireBattleAcceptance && !isBattlePoetic) return toast.error("Acceptez le duel.");
    if (!isConcours && content.trim().length < 50) return toast.error("Le texte doit contenir au moins 50 caractères.");

    setLoading(true);
    const toastId = toast.loading("Publication en cours sur Lisible...");

    try {
      let imageBase64 = imagePreview;
      if (imageFile) imageBase64 = await toBase64(imageFile);

      const payload = {
        title: title.trim(),
        content: content.trim(),
        category,
        authorName: user.penName || user.name || "Plume Anonyme",
        authorEmail: user.email.toLowerCase().trim(),
        imageBase64,
        isConcours,
        concurrentId: concurrentId?.toUpperCase() || null,
      };

      const res = await fetch(onSubmitApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Lecture sécurisée de la réponse pour éviter "Unexpected end of JSON"
      const contentType = res.headers.get("content-type");
      let data;
      
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        // Le serveur a renvoyé du texte ou du HTML (souvent une erreur 500)
        const errorText = await res.text();
        console.error("Réponse brute du serveur:", errorText);
        throw new Error("Le serveur ne répond pas correctement. Vérifiez votre connexion ou la route API.");
      }

      if (!res.ok) {
        throw new Error(data.error || data.message || "Échec de la publication");
      }

      toast.success(isConcours ? "Duel engagé !" : "Œuvre publiée ✨", { id: toastId });

      if (!isConcours) {
        localStorage.removeItem("draft_title");
        localStorage.removeItem("draft_content");
      }

      // Redirection vers l'œuvre
      if (data.id) {
        router.push(`/texts/${data.id}`);
      } else {
        router.refresh();
      }

    } catch (err) {
      console.error("Erreur lors de l'envoi:", err);
      toast.error(err.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="h-64 flex items-center justify-center bg-transparent">
        <Loader2 className="animate-spin text-teal-600" size={30} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 font-sans">
      {/* Battle / Duel Acceptance */}
      {requireBattleAcceptance && (
        <div 
          className={`p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer flex flex-col items-center justify-center text-center ${isBattlePoetic ? 'border-teal-500 bg-teal-500/10' : 'border-slate-100 opacity-40 hover:opacity-60'}`}
          onClick={() => setIsBattlePoetic(!isBattlePoetic)}
        >
          <CheckCircle2 className={isBattlePoetic ? "text-teal-600" : "text-slate-600"} size={32} />
          <p className="text-[10px] font-black uppercase text-slate-900 mt-4 tracking-widest">Accepter le Duel</p>
        </div>
      )}

      {requireBattleAcceptance && (
        <input
          type="text"
          value={concurrentId}
          onChange={(e) => setConcurrentId(e.target.value.toUpperCase())}
          placeholder="ID DU CONCURRENT"
          required
          className="w-full bg-slate-50 border-2 border-slate-100 py-4 px-6 rounded-2xl text-2xl font-black outline-none focus:border-teal-500 transition-all text-center"
        />
      )}

      {/* Titre */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Titre de l'œuvre</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Le Crépuscule des Mots"
          required
          className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-5 text-xl font-black italic outline-none focus:bg-white focus:border-teal-500/20 transition shadow-sm"
        />
      </div>

      {/* Catégorie */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Genre Littéraire</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl px-6 py-4 font-bold text-slate-600 outline-none focus:bg-white focus:border-teal-500/20 shadow-sm appearance-none"
        >
          {["Poésie", "Nouvelle", "Roman", "Chronique", "Essai", "Battle Poétique"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Contenu */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Manuscrit</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Laissez courir votre plume..."
          required
          className="w-full bg-slate-50 border-2 border-slate-50 rounded-[2.5rem] p-8 font-serif text-lg leading-relaxed min-h-[400px] outline-none focus:bg-white focus:border-teal-500/20 transition shadow-sm"
        />
      </div>

      {/* Image de Couverture */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Illustration de couverture</label>
        <input type="file" accept="image/*" id="cover" className="hidden" onChange={handleImageChange} />
        {imagePreview ? (
          <div className="relative h-64 rounded-[2rem] overflow-hidden shadow-xl border-4 border-white">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            <button 
              type="button" 
              onClick={() => { setImagePreview(null); setImageFile(null); }} 
              className="absolute top-4 right-4 bg-rose-500 text-white p-3 rounded-full shadow-md hover:bg-rose-600 transition"
            >
              <X size={20} />
            </button>
          </div>
        ) : (
          <label htmlFor="cover" className="flex flex-col items-center justify-center p-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] cursor-pointer hover:bg-teal-50/50 hover:border-teal-200 transition group">
            <ImageIcon size={40} className="text-slate-300 group-hover:text-teal-500 transition-colors" />
            <span className="text-[10px] font-black uppercase text-slate-400 mt-4 tracking-[0.2em]">Ajouter une couverture (2Mo max)</span>
          </label>
        )}
      </div>

      {/* Bouton de Publication */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-slate-900 text-white py-7 rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[13px] flex justify-center items-center hover:bg-teal-600 transition-all shadow-2xl shadow-slate-200 active:scale-[0.98] disabled:opacity-50"
      >
        {loading ? (
          <div className="flex items-center gap-3">
            <Loader2 className="animate-spin" size={20} />
            <span>Inspiration en cours...</span>
          </div>
        ) : (
          submitLabel
        )}
      </button>
    </form>
  );
}
