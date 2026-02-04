"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2, Save, ArrowLeft, Edit3, Type, Tag, AlignLeft } from "lucide-react";
import { toast } from "sonner";

export default function EditWorkPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params; // L'ID du texte (nom du fichier)

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    summary: ""
  });

  // 1. Charger l'utilisateur et les données du texte
  useEffect(() => {
    const logged = localStorage.getItem("lisible_user");
    if (!logged) {
      router.push("/login");
      return;
    }
    const currentUser = JSON.parse(logged);
    setUser(currentUser);

    const fetchWork = async () => {
      try {
        const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/posts/${id}.json?t=${Date.now()}`);
        if (!res.ok) throw new Error("Œuvre introuvable");
        
        const fileData = await res.json();
        const content = JSON.parse(atob(fileData.content));

        // Vérification de sécurité côté client (immédiate)
        if (content.authorEmail?.toLowerCase() !== currentUser.email.toLowerCase()) {
          toast.error("Accès non autorisé");
          router.push("/dashboard");
          return;
        }

        setFormData({
          title: content.title || "",
          content: content.content || "",
          category: content.category || "",
          summary: content.summary || ""
        });
      } catch (err) {
        toast.error("Erreur lors du chargement");
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchWork();
  }, [id, router]);

  // 2. Gestion de la sauvegarde
  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const tid = toast.loading("Mise à jour de l'œuvre...");

    try {
      const res = await fetch("/api/works/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workId: id,
          userEmail: user.email,
          updatedData: formData
        })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Modifications enregistrées !", { id: tid });
        router.push("/dashboard");
      } else {
        throw new Error(data.error || "Erreur lors de la sauvegarde");
      }
    } catch (err) {
      toast.error(err.message, { id: tid });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#FCFBF9]">
      <Loader2 className="animate-spin text-teal-600 mb-4" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Récupération du manuscrit...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FCFBF9] py-12 px-6 font-sans">
      <div className="max-w-3xl mx-auto">
        
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-teal-600 transition-colors mb-8">
          <ArrowLeft size={14} /> Retour au tableau de bord
        </button>

        <header className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <Edit3 className="text-teal-600" size={24} />
            <h1 className="text-3xl font-serif font-black italic">Modifier l'œuvre</h1>
          </div>
          <p className="text-slate-500 text-sm">Édition sécurisée de votre création littéraire.</p>
        </header>

        <form onSubmit={handleSave} className="space-y-8">
          {/* Titre */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Type size={14}/> Titre de l'œuvre
            </label>
            <input 
              type="text" 
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full p-6 bg-white border border-slate-100 rounded-[1.5rem] text-xl font-serif font-bold focus:ring-2 ring-teal-500/20 outline-none transition-all shadow-sm"
            />
          </div>

          {/* Catégorie */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Tag size={14}/> Catégorie
            </label>
            <select 
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full p-4 bg-white border border-slate-100 rounded-2xl font-bold text-sm focus:ring-2 ring-teal-500/20 outline-none appearance-none cursor-pointer shadow-sm"
            >
              <option value="Poésie">Poésie</option>
              <option value="Nouvelle">Nouvelle</option>
              <option value="Roman">Roman</option>
              <option value="Essai">Essai</option>
              <option value="Chronique">Chronique</option>
            </select>
          </div>

          {/* Corps du texte */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <AlignLeft size={14}/> Contenu du texte
            </label>
            <textarea 
              required
              rows={15}
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              className="w-full p-8 bg-white border border-slate-100 rounded-[2rem] font-serif text-lg leading-relaxed focus:ring-2 ring-teal-500/20 outline-none transition-all shadow-sm"
              placeholder="Écrivez votre texte ici..."
            />
          </div>

          {/* Bouton de sauvegarde */}
          <button 
            type="submit" 
            disabled={submitting}
            className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 hover:bg-teal-600 transition-all shadow-xl disabled:opacity-50"
          >
            {submitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Enregistrer les modifications
          </button>
        </form>
      </div>
    </div>
  );
}
