"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, BookOpen, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PublishPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isConcours: false
  });

  const handlePublish = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          authorEmail: "user@example.com", // À récupérer via ta session/auth
          penName: "Ma Plume" 
        }),
      });

      const result = await res.json();
      if (result.success) {
        toast.success("Texte publié avec succès !");
        router.push('/bibliotheque');
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      toast.error("Échec de la publication");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <h1 className="text-5xl font-black italic tracking-tighter text-slate-900">Publier.</h1>
          <p className="text-teal-600 font-bold uppercase text-[10px] tracking-widest mt-2 flex items-center gap-2">
            <Sparkles size={14}/> Partagez votre univers au monde
          </p>
        </header>

        <form onSubmit={handlePublish} className="space-y-8">
          <input 
            type="text"
            placeholder="Titre de votre œuvre..."
            className="w-full text-4xl font-bold outline-none border-b border-slate-100 pb-4 focus:border-teal-500 transition-colors"
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
          />

          <textarea 
            placeholder="Écrivez ici..."
            className="w-full h-96 text-lg leading-relaxed outline-none resize-none text-slate-700"
            onChange={(e) => setFormData({...formData, content: e.target.value})}
            required
          />

          <div className="flex items-center justify-between bg-slate-50 p-6 rounded-3xl">
            <div className="flex items-center gap-4">
              <input 
                type="checkbox" 
                id="concours"
                className="w-5 h-5 accent-teal-600"
                onChange={(e) => setFormData({...formData, isConcours: e.target.checked})}
              />
              <label htmlFor="concours" className="text-sm font-bold text-slate-600">Participer au concours en cours</label>
            </div>

            <button 
              disabled={loading}
              className="bg-slate-950 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-teal-600 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={16}/> : <Send size={16}/>}
              Mettre en ligne
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
