"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { Trophy, Send, ArrowLeft, Loader2, CheckCircle2, Image as ImageIcon, X } from "lucide-react"; 
import Link from "next/link";

export default function ConcoursPublishPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isBattlePoetic, setIsBattlePoetic] = useState(false);
  const [concurrentId, setConcurrentId] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loggedUser = localStorage.getItem("lisible_user");
    if (!loggedUser) {
      router.push("/login");
    } else {
      setUser(JSON.parse(loggedUser));
    }
  }, [router]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return toast.error("Image trop lourde (max 2Mo)");
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
    if (!isBattlePoetic) return toast.error("Acceptez le règlement du duel.");
    
    setLoading(true);
    const loadingToast = toast.loading("Entrée dans l'arène...");

    try {
      let imageBase64 = null;
      if (imageFile) imageBase64 = await toBase64(imageFile);

      const res = await fetch("/api/texts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: user.penName || user.name || concurrentId.toUpperCase(),
          authorEmail: user.email.toLowerCase().trim(),
          title: title.trim(),
          content: content.trim(),
          imageBase64,
          isConcours: true,
          concurrentId: concurrentId.toUpperCase(),
          category: "Battle Poétique"
        })
      });

      const data = await res.json().catch(() => ({ error: "Réponse serveur invalide." }));

      if (!res.ok) throw new Error(data.error || "Échec de l'entrée dans l'arène.");

      toast.success("Duel engagé !", { id: loadingToast });
      router.push(`/texts/${data.id}`);
      
    } catch (err) {
      console.error("Erreur Concours:", err);
      toast.error(err.message, { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 px-5 pt-10 font-sans">
      <Link
        href="/bibliotheque"
        className="group inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-teal-500 transition-colors"
      >
        <ArrowLeft size={16} /> Retour Bibliothèque
      </Link>

      <div className="relative bg-slate-950 p-8 md:p-14 rounded-[4rem] border border-white/10 shadow-3xl overflow-hidden">
        <form onSubmit={handleSubmit} className="relative z-10 space-y-10">
          <header className="flex flex-col md:flex-row items-center gap-8">
            <div className="p-6 bg-teal-500 rounded-[2.5rem] text-white shadow-xl shadow-teal-500/20">
              <Trophy size={40} />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black italic text-white leading-none">
                Arène Poétique
              </h1>
              <p className="text-teal-400 text-[10px] font-black uppercase tracking-[0.3em] mt-3">
                Édition Spéciale : Duel de Plumes
              </p>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              onClick={() => setIsBattlePoetic(!isBattlePoetic)}
              className={`p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
                isBattlePoetic
                  ? "border-teal-500 bg-teal-500/10"
                  : "border-white/5 opacity-40 hover:opacity-60"
              }`}
            >
              <CheckCircle2
                className={isBattlePoetic ? "text-teal-400" : "text-slate-600"}
                size={32}
              />
              <p className="text-[10px] font-black uppercase text-white mt-4 tracking-widest">
                Accepter le Duel
              </p>
            </div>

            <div className="p-8 rounded-[2.5rem] border-2 border-white/10 bg-white/5">
              <label className="text-[10px] font-black uppercase text-teal-400 tracking-widest">
                ID Concurrent
              </label>
              <input
                type="text"
                value={concurrentId}
                onChange={(e) => setConcurrentId(e.target.value.toUpperCase())}
                className="w-full bg-transparent border-b-2 border-white/10 py-2 text-2xl font-black outline-none focus:border-teal-500 text-white placeholder:text-white/10"
                placeholder="EX: LIS-99"
                required
              />
            </div>
          </div>

          <div className="space-y-8 bg-white/5 p-8 md:p-12 rounded-[3.5rem] border border-white/5">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent border-b-2 border-white/10 py-4 text-3xl italic font-black text-white focus:border-teal-500 transition-all outline-none"
              placeholder="Titre du poème..."
              required
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-white/5 border-2 border-white/5 rounded-[2.5rem] p-8 font-serif text-xl min-h-[400px] text-slate-200 outline-none focus:border-white/10 transition-all"
              placeholder="Composez vos vers..."
              required
            />
          </div>

          <div className="relative">
            <input
              type="file"
              id="cover"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            {imagePreview ? (
              <div className="relative rounded-[2.5rem] overflow-hidden h-48 border-2 border-white/10">
                <img
                  src={imagePreview}
                  className="w-full h-full object-cover opacity-60"
                  alt="Preview"
                />
                <button
                  type="button"
                  onClick={() => setImagePreview(null)}
                  className="absolute top-4 right-4 bg-rose-500 p-2 rounded-full text-white shadow-xl"
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <label
                htmlFor="cover"
                className="flex items-center gap-4 p-8 bg-white/5 border-2 border-dashed border-white/10 rounded-[2.5rem] cursor-pointer hover:bg-white/10 transition-all group"
              >
                <div className="p-4 bg-white/5 rounded-2xl text-slate-400 group-hover:text-teal-400 transition-colors">
                  <ImageIcon size={24} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Ajouter une aura visuelle (Facultatif)
                </p>
              </label>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-500 text-slate-950 py-8 rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.4em] shadow-2xl hover:bg-white active:scale-95 transition-all flex justify-center items-center gap-4 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : "Lancer le défi"}
          </button>
        </form>
      </div>
    </div>
  );
}