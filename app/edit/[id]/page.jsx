"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation"; 
import { Loader2, Save, ArrowLeft, Edit3, Type, Tag, Sparkles } from "lucide-react";
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

  const fetchWork = useCallback(async (currentUser, workId) => {
    try {
      const res = await fetch(`/api/github-db?type=text&id=${workId}`);
      const data = await res.json();
      
      if (!data || !data.content) throw new Error("Le manuscrit est introuvable");
      
      const content = data.content;

      if (content.authorEmail?.toLowerCase().trim() !== currentUser.email?.toLowerCase().trim()) {
        toast.error("Violation d'accès : Ce manuscrit appartient à une autre plume.");
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
      toast.error("Échec de l'ouverture du parchemin.");
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

  const handleSave = async (e) => {
    e.preventDefault();
    if (formData.content.length < 50) return toast.error("Le manuscrit est trop court.");
    
    setSubmitting(true);
    const tid = toast.loading("Mise à jour des archives...");

    try {
      const res = await fetch("/api/github-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "publish",
          id: id, 
          userEmail: user.email,
          ...formData,
          authorName: user.name || "Auteur Lisible",
          authorEmail: user.email,
          updatedAt: new Date().toISOString()
        })
      });

      if (res.ok) {
        toast.success("Manuscrit ré-archivé !", { id: tid });
        router.push("/dashboard");
      } else {
        throw new Error("Erreur de synchronisation");
      }
    } catch (err) {
      toast.error(err.message, { id: tid });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#FCFBF9] gap-6">
      <div className="relative">
        <Loader2 className="animate-spin text-teal-600" size={50} />
        <Sparkles className="absolute -top-2 -right-2 text-amber-400 animate-pulse" size={20} />
      </div>
      <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">Restauration du texte...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FCFBF9] py-12 px-6">
      <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000">
        
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <button 
              onClick={() => router.back()} 
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-teal-600 transition-all mb-6 group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
              Quitter l'éditeur
            </button>
            <div className="flex items-center gap-4">
              <div className="p-4 bg-slate-900 text-white rounded-[1.5rem] shadow-xl">
                <Edit3 size={28} />
              </div>
              <div>
                <h1 className="text-4xl font-serif font-black italic text-slate-900 tracking-tighter leading-none">Retoucher l'œuvre</h1>
                <p className="text-[10px] font-bold text-teal-600 uppercase tracking-[0.2em] mt-2">ID : {id}</p>
              </div>
            </div>
          </div>
        </header>

        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 ml-2">
                <Type size={14} className="text-teal-500" /> Titre
              </label>
              <input 
                type="text" 
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full p-4 bg-slate-50 border-none rounded-2xl text-2xl font-serif font-black text-slate-900 focus:bg-white focus:ring-4 ring-teal-500/5 outline-none transition-all"
              />
            </div>

            <div className="bg-white p-2 rounded-[3rem] border border-slate-100 shadow-sm">
              <textarea 
                required
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                className="w-full p-10 pt-14 bg-transparent min-h-[600px] font-serif text-xl leading-relaxed text-slate-800 outline-none resize-none"
                placeholder="Exprimez-vous..."
              />
            </div>
          </div>

          <aside className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 sticky top-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Tag size={14} /> Genre
                </label>
                <select 
                  value={formData.genre}
                  onChange={(e) => setFormData({...formData, genre: e.target.value})}
                  className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm text-slate-700 outline-none cursor-pointer"
                >
                  <option value="Poésie">Poésie</option>
                  <option value="Nouvelle">Nouvelle</option>
                  <option value="Roman">Roman</option>
                  <option value="Essai">Essai</option>
                  <option value="Chronique">Chronique</option>
                  <option value="Battle Poétique">Battle Poétique</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full py-6 bg-slate-950 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 hover:bg-teal-600 transition-all shadow-2xl disabled:opacity-50"
              >
                {submitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                {submitting ? "Mise à jour..." : "Sauvegarder"}
              </button>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}
