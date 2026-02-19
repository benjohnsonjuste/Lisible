"use client";
import { useState } from "react";
import { Mic, Video, Radio, Sparkles, ShieldCheck, Globe } from "lucide-react";
import { toast } from "sonner";

export default function ClubDashboard({ currentUser }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    type: "audio", // 'audio' ou 'video'
    genre: "Lecture Poétique",
    streamUrl: "",
  });

  const genres = [
    "Lecture Poétique",
    "Débat Littéraire",
    "Atelier d'Écriture",
    "Scène Ouverte",
    "Podcast Live"
  ];

  const startLive = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.streamUrl) {
      return toast.error("Complète le titre et le lien du flux !");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/github-db", {
        method: "POST",
        body: JSON.stringify({
          action: "start-live",
          userEmail: currentUser.email,
          userName: currentUser.name,
          userAvatar: currentUser.avatar || "/default-avatar.png",
          ...formData
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Salon ouvert ! Redirection...");
        window.location.href = `/club/live/${data.liveId}`;
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast.error("Erreur : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 lg:p-12 shadow-2xl">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-4 bg-blue-600/20 rounded-2xl text-blue-500">
          <Radio size={32} className="animate-pulse" />
        </div>
        <div>
          <h2 className="text-3xl font-serif italic text-white">Studio Club</h2>
          <p className="text-slate-500 text-xs font-black uppercase tracking-widest mt-1">Configure ta diffusion</p>
        </div>
      </div>

      <form onSubmit={startLive} className="space-y-8">
        {/* Titre du Salon */}
        <div className="space-y-3">
          <label className="text-slate-400 text-[10px] font-black uppercase tracking-widest ml-2">Thème ou Titre</label>
          <input
            required
            type="text"
            placeholder="Ex: Ma première lecture en direct..."
            className="w-full bg-slate-950 border border-white/5 rounded-2xl py-5 px-6 text-white focus:border-blue-500 transition-all outline-none"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        {/* Type de Flux */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: "audio" })}
            className={`flex flex-col items-center gap-3 p-6 rounded-[2rem] border-2 transition-all ${
              formData.type === "audio" ? "border-blue-500 bg-blue-500/10 text-white" : "border-white/5 bg-slate-950 text-slate-500"
            }`}
          >
            <Mic size={24} />
            <span className="font-black text-[10px] uppercase tracking-widest">Audio Solo</span>
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: "video" })}
            className={`flex flex-col items-center gap-3 p-6 rounded-[2rem] border-2 transition-all ${
              formData.type === "video" ? "border-blue-500 bg-blue-500/10 text-white" : "border-white/5 bg-slate-950 text-slate-500"
            }`}
          >
            <Video size={24} />
            <span className="font-black text-[10px] uppercase tracking-widest">Flux Vidéo</span>
          </button>
        </div>

        {/* Sélection du Genre */}
        <div className="space-y-3">
          <label className="text-slate-400 text-[10px] font-black uppercase tracking-widest ml-2">Catégorie</label>
          <select 
            className="w-full bg-slate-950 border border-white/5 rounded-2xl py-5 px-6 text-white outline-none appearance-none"
            value={formData.genre}
            onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
          >
            {genres.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        {/* Lien de diffusion */}
        <div className="space-y-3">
          <label className="text-slate-400 text-[10px] font-black uppercase tracking-widest ml-2 flex justify-between">
            Lien du flux (YouTube / M3U8 / MP3)
            <ShieldCheck size={14} className="text-green-500" />
          </label>
          <input
            required
            type="url"
            placeholder="https://..."
            className="w-full bg-slate-950 border border-white/5 rounded-2xl py-5 px-6 text-white focus:border-blue-500 transition-all outline-none text-xs font-mono"
            value={formData.streamUrl}
            onChange={(e) => setFormData({ ...formData, streamUrl: e.target.value })}
          />
          <p className="text-[9px] text-slate-600 px-2 italic">Lisible supporte les liens YouTube directs ou les fichiers multimédias.</p>
        </div>

        {/* Bouton Lancement */}
        <button
          disabled={loading}
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Sparkles size={18} />
              Passer en Direct
            </>
          )}
        </button>
      </form>
    </div>
  );
}
