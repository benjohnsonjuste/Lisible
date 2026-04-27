"use client";
import React from 'react';
import { FileText, Edit3, Trash2, ExternalLink, ShieldCheck, BookOpen, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function MesManuscrits({ works, setWorks }) {
  
  const handleDelete = async (id, title) => {
    if (!confirm(`Voulez-vous vraiment supprimer définitivement "${title}" ?`)) return;
    
    const toastId = toast.loading("Suppression en cours...");
    
    try {
      const res = await fetch('/api/manage-text', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textId: id })
      });

      if (res.ok) {
        setWorks(prev => prev.filter(w => w.id !== id));
        toast.success("Manuscrit retiré des archives.", { id: toastId });
      } else {
        throw new Error();
      }
    } catch (e) {
      toast.error("Erreur lors de la suppression.", { id: toastId });
    }
  };

  if (!works) return <Loader2 className="animate-spin text-teal-600 mx-auto" />;

  return (
    <div className="grid grid-cols-1 gap-4">
      {works.length > 0 ? (
        works.map((work) => (
          <div key={work.id} className="group bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-teal-50 group-hover:text-teal-500 transition-colors">
                <FileText size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-slate-900 leading-tight">{work.title}</h3>
                  {work.certified > 0 && <ShieldCheck size={16} className="text-teal-500" />}
                </div>
                <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span>{work.category || "Littérature"}</span>
                  <span className="flex items-center gap-1"><BookOpen size={12}/> {work.views || 0}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Bouton de lecture externe */}
              <Link href={`/texts/${work.id}`} className="p-4 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-colors">
                <ExternalLink size={18} />
              </Link>

              {/* BOUTON MODIFICATION : Redirige vers app/edit/[id] */}
              <Link href={`/edit/${work.id}`} className="p-4 bg-teal-50 text-teal-600 rounded-2xl hover:bg-teal-600 hover:text-white transition-all">
                <Edit3 size={18} />
              </Link>

              {/* BOUTON SUPPRESSION */}
              <button 
                onClick={() => handleDelete(work.id, work.title)}
                className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="py-12 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
          <p className="text-slate-400 font-medium italic text-sm">Aucun texte trouvé.</p>
        </div>
      )}
    </div>
  );
}
