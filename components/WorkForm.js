"use client";

import { useState, useEffect } from "react";
// Changement : Utilisation de next/navigation pour le App Router
import { useRouter } from "next/navigation"; 
import { toast } from "sonner";
import { Loader2, Image as ImageIcon, X, CheckCircle2 } from "lucide-react";

export default function WorkForm({
  initialData = {},
  isConcours = false,
  requireBattleAcceptance = false,
  submitLabel = "Diffuser",
  onSubmitApi = "/api/texts",
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
    const u = JSON.parse(storedUser);
    setUser(u);

    if (!isConcours) {
      setTitle(localStorage.getItem("draft_title") || title);
      setContent(localStorage.getItem("draft_content") || content);
    }

    setIsChecking(false);
  }, [router, isConcours, title, content]);

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

  // ===== Submit Handler =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!user?.email) return toast.error("Utilisateur non identifié.");
    if (requireBattleAcceptance && !isBattlePoetic) return toast.error("Acceptez le duel.");
    if (!isConcours && content.trim().length < 50) return toast.error("Le texte doit contenir au moins 50 caractères.");

    setLoading(true);
    const toastId = toast.loading("Publication en cours…");

    try {
      let imageBase64 = imagePreview;
      if (imageFile) imageBase64 = await toBase64(imageFile);

      const payload = {
        title: title.trim(),
        content: content.trim(),
        category,
        authorName: user.penName || user.name || (concurrentId || "Plume"),
        authorEmail: user.email.toLowerCase().trim(),
        imageBase64,
        isConcours,
        concurrentId: concurrentId?.toUpperCase(),
      };

      const res = await fetch(onSubmitApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Échec de la publication");

      toast.success(isConcours ? "Duel engagé !" : "Œuvre publiée ✨", { id: toastId });

      if (!isConcours) {
        localStorage.removeItem("draft_title");
        localStorage.removeItem("draft_content");
      }

      // App Router push
      router.push(`/texts/${data.id}`);
    } catch (err) {
      toast.error(err.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#FCFBF9]">
        <Loader2 className="animate-spin text-teal-600" size={30} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 font-sans">
      {/* Battle / Duel */}
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
          placeholder="ID Concurrent"
          required
          className="w-full bg-slate-50 border-2 border-slate-100 py-4 px-6 rounded-2xl text-2xl font-black outline-none focus:border-teal-500 transition-all"
        />
      )}

      {/* Titre */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titre de votre œuvre…"
        required
        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-5 text-xl font-black italic outline-none focus:bg-white focus:border-teal-500/20 transition shadow-sm"
      />

      {/* Catégorie */}
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl px-6 py-4 font-bold text-slate-600 outline-none focus:bg-white focus:border-teal-500/20 shadow-sm"
      >
        {["Poésie", "Nouvelle", "Roman", "Chronique", "Essai", "Battle Poétique"].map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      {/* Contenu */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Laissez courir votre plume…"
        required
        className="w-full bg-slate-50 border-2 border-slate-50 rounded-[2.5rem] p-8 font-serif text-lg leading-relaxed min-h-[350px] outline-none focus:bg-white focus:border-teal-500/20 transition shadow-sm"
      />

      {/* Image */}
      <div>
        <input type="file" accept="image/*" id="cover" className="hidden" onChange={handleImageChange} />
        {imagePreview ? (
          <div className="relative h-56 rounded-[2rem] overflow-hidden shadow-lg">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            <button type="button" onClick={() => setImagePreview(null)} className="absolute top-4 right-4 bg-rose-500 text-white p-2 rounded-full shadow-md hover:scale-110 transition">
              <X size={18} />
            </button>
          </div>
        ) : (
          <label htmlFor="cover" className="flex flex-col items-center justify-center p-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] cursor-pointer hover:bg-teal-50 transition">
            <ImageIcon size={32} className="text-slate-300" />
            <span className="text-[10px] font-black uppercase text-slate-400 mt-3 tracking-[0.2em]">Couverture (optionnelle)</span>
          </label>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-slate-900 text-white py-7 rounded-[2rem] font-black uppercase tracking-[0.4em] text-[12px] flex justify-center items-center hover:bg-teal-600 transition-all shadow-xl active:scale-95 disabled:opacity-50"
      >
        {loading ? <Loader2 className="animate-spin" size={20} /> : submitLabel}
      </button>
    </form>
  );
}
