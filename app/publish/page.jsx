"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, CheckCircle, AlertCircle, Loader2, Sparkles, Coins } from 'lucide-react';
import { toast } from 'sonner';

export default function PublishPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');

  // Note: Dans une version finale, ces infos viendraient de ta session utilisateur
  const currentUser = {
    penName: "Rodley Robergeau Fontaine",
    email: "robergeaurodley97@gmail.com",
    role: "verified", // Permet d'activer le badge 'certified' automatiquement
    balance: 150
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (content.length < 100) {
      return toast.error("Votre œuvre est trop courte pour être publiée.");
    }

    setLoading(true);
    const formData = new FormData(e.target);
    
    const payload = {
      title: formData.get('title'),
      category: formData.get('category'),
      isConcours: formData.get('isConcours') === 'on',
      content: content,
      penName: currentUser.penName,
      authorEmail: currentUser.email,
      authorRole: currentUser.role,
      // Metadata pour l'indexation
      wordCount: content.split(/\s+/).length,
      publishedAt: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/github-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (res.ok) {
        toast.success("Succès ! Votre œuvre est enregistrée dans le Data Lake.");
        router.push(`/texts/${result.id}`);
      } else {
        throw new Error(result.error || "Erreur lors du commit");
      }
    } catch (err) {
      console.error(err);
      toast.error("Échec de la synchronisation avec GitHub.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 md:py-20 px-6 animate-in fade-in duration-700">
      <header className="mb-12">
        <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-slate-900 leading-[0.8]">
          Publier<span className="text-teal-600">.</span>
        </h1>
        <div className="flex items-center gap-4 mt-6">
          <div className="flex items-center gap-2 px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-[10px] font-black uppercase tracking-widest">
            <Coins size={12}/> {currentUser.balance} Li disponibles
          </div>
          <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
            {currentUser.penName}
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-12">
        <div className="space-y-6">
          <input 
            name="title"
            autoFocus
            className="text-4xl md:text-6xl font-black italic tracking-tighter w-full outline-none border-b-4 border-slate-50 focus:border-teal-500 transition-all placeholder:text-slate-100"
            placeholder="Titre de l'œuvre"
            required
          />
          
          <div className="flex flex-wrap gap-4">
            <select name="category" className="bg-slate-50 border-none p-4 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-500 outline-none focus:ring-2 ring-teal-500/20">
              <option value="Poetry">Poésie</option>
              <option value="Novel">Roman / Nouvelle</option>
              <option value="Essay">Essai</option>
              <option value="Battle">Battle Littéraire</option>
            </select>

            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-2xl text-[10px] font-black uppercase tracking-widest">
              <Sparkles size={14}/> Mode Création Activé
            </div>
          </div>
        </div>

        <textarea 
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-[400px] md:h-[600px] text-xl md:text-2xl font-serif leading-relaxed outline-none bg-slate-50/20 p-8 md:p-12 rounded-[3rem] border-2 border-transparent focus:border-slate-50 transition-all placeholder:text-slate-200"
          placeholder="Laissez couler votre plume ici..."
          required
        />

        <div className="bg-slate-950 p-8 md:p-10 rounded-[3.5rem] flex flex-col md:flex-row gap-8 items-center justify-between shadow-2xl shadow-slate-200">
          <label className="flex items-center gap-4 cursor-pointer group">
            <div className="relative">
              <input type="checkbox" name="isConcours" className="peer sr-only" />
              <div className="w-12 h-6 bg-slate-800 rounded-full peer-checked:bg-teal-500 transition-colors"></div>
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-6 transition-transform"></div>
            </div>
            <span className="font-black italic uppercase text-[10px] text-slate-400 group-hover:text-white transition-colors tracking-widest">
              Participer au concours officiel
            </span>
          </label>

          <button 
            disabled={loading}
            className="w-full md:w-auto bg-teal-500 text-white px-12 py-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] hover:bg-white hover:text-slate-950 transition-all disabled:opacity-20 flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18}/>
                Synchronisation...
              </>
            ) : (
              <>
                <UploadCloud size={18}/>
                Push Publication
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
