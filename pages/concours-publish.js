"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trophy, Send, ArrowLeft, Loader2, CheckCircle2, Hash, Sparkles, Wand2, Flame } from "lucide-react"; 
import Link from "next/link";

export default function ConcoursPublishPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isBattlePoetic, setIsBattlePoetic] = useState(false);
  const [concurrentId, setConcurrentId] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loggedUser = localStorage.getItem("lisible_user");
    if (!loggedUser) {
      toast.error("Veuillez vous connecter.");
      router.push("/login"); 
    } else {
      setUser(JSON.parse(loggedUser));
    }
  }, [router]);

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isBattlePoetic) return toast.error("Acceptez le règlement.");
    
    setLoading(true);
    const loadingToast = toast.loading("Entrée dans l'arène...");

    try {
      let imageBase64 = null;
      if (imageFile) imageBase64 = await toBase64(imageFile);

      const res = await fetch("/api/texts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: concurrentId.toUpperCase(),
          authorEmail: user.email.toLowerCase().trim(),
          title: title.trim(),
          content: content.trim(),
          imageBase64,
          isConcours: true,
          concurrentId: concurrentId.toUpperCase(),
          date: new Date().toISOString(),
          views: 0,
          totalLikes: 0,
          totalCertified: 0, 
          genre: "Battle Poétique",
          comments: []
        })
      });

      // LECTURE SÉCURISÉE DE LA RÉPONSE POUR ÉVITER "UNEXPECTED END OF JSON"
      const responseText = await res.text();
      let data;
      
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        throw new Error("Le serveur a renvoyé une réponse illisible ou vide.");
      }

      if (!res.ok) throw new Error(data.error || "Erreur lors de l'entrée dans l'arène.");
      if (!data.id) throw new Error("ID de duel manquant dans la réponse.");

      toast.success("Duel engagé !", { id: loadingToast });
      router.push(`/texts/${data.id}`);
      
    } catch (err) {
      console.error("Erreur Concours:", err);
      toast.error(err.message || "Échec de l'envoi.", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 px-5 pt-10 font-sans">
      <Link href="/bibliotheque" className="group inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
        <ArrowLeft size={16} /> Retour Bibliothèque
      </Link>

      <div className="relative bg-slate-950 p-8 md:p-14 rounded-[4rem] border border-white/10 shadow-3xl overflow-hidden">
        <form onSubmit={handleSubmit} className="relative z-10 space-y-10">
          <header className="flex flex-col md:flex-row items-center gap-8">
            <div className="p-6 bg-teal-500 rounded-[2.5rem] text-white">
              <Trophy size={40} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black italic text-white font-sans">Arène Poétique</h1>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div onClick={() => setIsBattlePoetic(!isBattlePoetic)} className={`p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer ${isBattlePoetic ? 'border-teal-500 bg-teal-500/10' : 'border-white/5 opacity-50'}`}>
              <CheckCircle2 className={isBattlePoetic ? "text-teal-400" : "text-slate-600"} size={28} />
              <p className="text-xs font-black uppercase text-white mt-4">Règlement de Duel</p>
            </div>
            <div className="p-8 rounded-[2.5rem] border-2 border-white/10 bg-white/5">
                <label className="text-[10px] font-black uppercase text-teal-400">ID Unique</label>
                <input
                  type="text"
                  value={concurrentId}
                  onChange={(e) => setConcurrentId(e.target.value.toUpperCase())}
                  className="w-full bg-transparent border-b-2 border-white/10 py-2 text-2xl font-black outline-none focus:border-teal-500 text-white"
                  placeholder="ID CONCURRENT"
                  required
                />
            </div>
          </div>

          <div className="space-y-8 bg-white/5 p-8 md:p-12 rounded-[3.5rem] border border-white/5">
               <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent border-b-2 border-white/10 py-4 text-3xl italic font-black text-white"
                placeholder="Titre du duel..."
                required
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-white/5 border-2 border-white/5 rounded-[2.5rem] p-8 font-serif text-xl min-h-[400px] text-slate-200"
                placeholder="Votre poème..."
                required
              />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-teal-500 text-slate-950 py-8 rounded-[2.5rem] font-black text-[12px] uppercase shadow-2xl hover:bg-white transition-all flex justify-center items-center gap-4">
            {loading ? <Loader2 className="animate-spin" size={24} /> : <><Send size={22} className="-rotate-12" /> Entrer dans l'Arène</>}
          </button>
        </form>
      </div>
    </div>
  );
}
