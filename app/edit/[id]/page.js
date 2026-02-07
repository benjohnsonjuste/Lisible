"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation"; 
import { Loader2, Save, ArrowLeft, Edit3, Type, Tag, AlignLeft } from "lucide-react";
import { toast } from "sonner";

export default function EditWorkPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id; 

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    genre: "Poésie",
    summary: ""
  });

  // Récupération sécurisée du manuscrit depuis GitHub
  const fetchWork = useCallback(async (currentUser, workId) => {
    try {
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/texts/${workId}.json?t=${Date.now()}`);
      
      if (!res.ok) throw new Error("Le manuscrit est introuvable");
      
      const fileData = await res.json();
      
      // Décodage Base64 robuste pour supporter les accents (UTF-8)
      const content = JSON.parse(decodeURIComponent(escape(atob(fileData.content))));

      // Sécurité : Seul l'auteur peut éditer son œuvre
      if (content.authorEmail?.toLowerCase() !== currentUser.email?.toLowerCase()) {
        toast.error("Accès refusé : Ce manuscrit ne vous appartient pas");
        router.push("/dashboard");
        return;
      }

      setFormData({
        title: content.title || "",
        content: content.content || "",
        genre: content.genre || content.category || "Poésie",
        summary: content.summary || ""
      });
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Échec lors de l'ouverture du parchemin");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const logged = localStorage.getItem("lisible_user");
    if (!logged) {
      router.push("/login");
      return;
    }
    const currentUser = JSON.parse(logged);
    setUser(currentUser);

    if (id) {
      fetchWork(currentUser, id);
    }
  }, [id, router, fetchWork]);

  // Sauvegarde des modifications via ton API unifiée
  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const tid = toast.loading("Scellement des modifications...");

    try {
      const res = await fetch("/api/publications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: id,
          userEmail: user.email,
          data: {
            ...formData,
            authorName: user.penName || user.name,
            updatedAt: new Date().toISOString()
          }
        })
      });

      if (res.ok) {
        toast.success("Manuscrit mis à jour !", { id: tid });
        router.push("/dashboard");
      } else {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la synchronisation");
      }
    } catch (err) {
      toast.error(err.message, { id: tid });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#FCFBF9] gap-4">
      <Loader2 className="animate-spin text-teal-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Accès au manuscrit...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FCFBF9] py-12 px-6 font-sans">
      <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <button 
          onClick={() => router.push("/dashboard")} 
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-teal-600 transition-all mb-8 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
          Retour au sanctuaire
        </button>

        <header className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl shadow-sm">
              <Edit3 size={24} />
            </div>
            <h1 className="text-3xl font-serif font-black italic text-slate-900">Retoucher l'œuvre</h1>
          </div>
          <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest flex items-center gap-2">
            ID: <span className="text-teal-600">{id}</span> • Édition sécurisée
          </p>
        </header>

        <form onSubmit={handleSave} className="space-y-8">
          {/* Titre de l'œuvre */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Type size={14}/> Titre de l'œuvre
            </label>
            <input 
              type="text" 
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full p-6 bg-white border border-slate-100 rounded-[1.5rem] text-xl font-serif font-bold text-slate-900 focus:ring-4 ring-teal-500/5 outline-none transition-all shadow-sm"
              placeholder="Modifier le titre..."
            />
          </div>

          {/* Genre / Catégorie */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Tag size={14}/> Genre Littéraire
            </label>
            <div className="relative">
              <select 
                value={formData.genre}
                onChange={(e) => setFormData({...formData, genre: e.target.value})}
                className="w-full p-5 bg-white border border-slate-100 rounded-2xl font-bold text-sm text-slate-600 focus:ring-4 ring-teal-500/5 outline-none appearance-none cursor-pointer shadow-sm"
              >
                <option value="Poésie">Poésie</option>
                <option value="Nouvelle">Nouvelle</option>
                <option value="Roman">Roman</option>
                <option value="Essai">Essai</option>
                <option value="Chronique">Chronique</option>
                <option value="Battle Poétique">Battle Poétique</option>
              </select>
              <Tag className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-20" size={16} />
            </div>
          </div>

          {/* Corps du texte */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <AlignLeft size={14}/> Contenu du Manuscrit
            </label>
            <textarea 
              required
              rows={15}
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              className="w-full p-8 bg-white border border-slate-100 rounded-[2rem] font-serif text-lg leading-relaxed text-slate-800 focus:ring-4 ring-teal-500/5 outline-none transition-all shadow-sm resize-none"
              placeholder="Écrivez ici..."
            />
          </div>

          {/* Bouton de sauvegarde */}
          <button 
            type="submit" 
            disabled={submitting}
            className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 hover:bg-teal-600 transition-all shadow-xl disabled:opacity-50 active:scale-95"
          >
            {submitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {submitting ? "Scellement..." : "Enregistrer les modifications"}
          </button>
        </form>
      </div>

      <footer className="mt-20 text-center border-t border-slate-50 pt-10">
        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">Scribe Éditeur v3.1 • 2026</p>
      </footer>
    </div>
  );
}
