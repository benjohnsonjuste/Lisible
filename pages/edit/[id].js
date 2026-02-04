"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, Save, Trash2, Loader2, Image as ImageIcon, 
  Type, AlignLeft, AlertCircle, CheckCircle 
} from "lucide-react";
import { toast } from "sonner";

export default function EditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    imageBase64: ""
  });

  // Vérification de l'utilisateur et récupération du texte
  useEffect(() => {
    const logged = localStorage.getItem("lisible_user");
    if (!logged) {
      router.push("/login");
      return;
    }
    const u = JSON.parse(logged);
    setUser(u);

    if (id) {
      const fetchText = async () => {
        try {
          const res = await fetch(`/api/texts?id=${id}`);
          if (res.ok) {
            const data = await res.json();
            // Sécurité : Vérifier si l'utilisateur est bien l'auteur
            if (data.authorEmail.toLowerCase() !== u.email.toLowerCase()) {
              toast.error("Accès non autorisé");
              router.push("/dashboard");
              return;
            }
            setFormData({
              title: data.title,
              content: data.content,
              imageBase64: data.imageBase64 || ""
            });
          }
        } catch (e) {
          toast.error("Erreur de chargement");
        } finally {
          setLoading(false);
        }
      };
      fetchText();
    }
  }, [id, router]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, imageBase64: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async () => {
    if (!formData.title || !formData.content) return toast.error("Champs requis manquants");
    setSaving(true);
    const tid = toast.loading("Mise à jour du manuscrit...");

    try {
      const res = await fetch(`/api/texts`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          action: "update",
          payload: formData
        })
      });

      if (res.ok) {
        toast.success("Œuvre mise à jour avec succès !", { id: tid });
        router.push("/dashboard");
      } else {
        toast.error("Échec de la mise à jour", { id: tid });
      }
    } catch (e) {
      toast.error("Erreur réseau", { id: tid });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("⚠️ Cette action est irréversible. Supprimer cette œuvre définitivement ?")) return;
    const tid = toast.loading("Suppression en cours...");
    try {
      const res = await fetch(`/api/texts/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("L'œuvre a été retirée", { id: tid });
        router.push("/dashboard");
      }
    } catch (e) {
      toast.error("Erreur lors de la suppression", { id: tid });
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#FCFBF9]">
      <Loader2 className="animate-spin text-teal-600 mb-4" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Récupération de l'œuvre...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FCFBF9] p-6 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Barre d'actions */}
        <header className="flex justify-between items-center bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
          <button onClick={() => router.back()} className="p-3 hover:bg-slate-50 rounded-2xl transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex gap-2">
            <button onClick={handleDelete} className="p-3 text-rose-500 hover:bg-rose-50 rounded-2xl transition-all">
              <Trash2 size={20} />
            </button>
            <button 
              onClick={handleUpdate} 
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-600 disabled:opacity-50 transition-all shadow-xl"
            >
              {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
              Enregistrer
            </button>
          </div>
        </header>

        {/* Formulaire d'édition */}
        <main className="bg-white rounded-[3rem] p-8 sm:p-12 shadow-sm border border-slate-100 space-y-10">
          
          {/* Titre */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <Type size={14} /> Titre de l'œuvre
            </label>
            <input 
              type="text" 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full text-3xl sm:text-4xl font-serif font-black italic border-none outline-none focus:text-teal-600 transition-colors"
              placeholder="Titre de votre texte..."
            />
          </div>

          {/* Image de couverture */}
          <div className="space-y-4">
             <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <ImageIcon size={14} /> Illustration
            </label>
            <div className="relative group w-full h-48 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center">
              {formData.imageBase64 ? (
                <>
                  <img src={formData.imageBase64} className="w-full h-full object-cover opacity-80" alt="Preview" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all flex items-center justify-center">
                    <label className="cursor-pointer bg-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">Changer l'image</label>
                  </div>
                </>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-2">
                  <ImageIcon className="text-slate-300" size={32} />
                  <span className="text-[10px] font-bold text-slate-400">Ajouter une couverture</span>
                </label>
              )}
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </div>
          </div>

          {/* Contenu */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <AlignLeft size={14} /> Le Manuscrit
            </label>
            <textarea 
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              rows={15}
              className="w-full font-serif text-lg leading-relaxed border-none outline-none resize-none focus:ring-0 text-slate-800"
              placeholder="Réécrivez l'histoire ici..."
            />
          </div>

        </main>

        <footer className="flex items-center justify-center gap-2 py-8 text-slate-300">
          <AlertCircle size={14} />
          <p className="text-[9px] font-bold uppercase tracking-widest">Toute modification sera visible instantanément par vos lecteurs.</p>
        </footer>
      </div>
    </div>
  );
}
