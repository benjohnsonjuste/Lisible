"use client";
import React, { useState, useEffect } from 'react';
import { Play, Trash2, Headphones, Clock, Eye, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

export default function MyPodcasts({ userEmail }) {
  const [podcasts, setPodcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchUserPodcasts();
  }, [userEmail]);

  const fetchUserPodcasts = async () => {
    try {
      const res = await fetch('/api/podcasts/register');
      if (res.ok) {
        const data = await res.json();
        // Filtrer pour n'afficher que les podcasts de l'utilisateur
        const mine = data.content.filter(p => p.hostEmail === userEmail);
        setPodcasts(mine);
      }
    } catch (error) {
      toast.error("Impossible de charger vos podcasts");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Voulez-vous vraiment supprimer l'épisode "${title}" ? Cette action est irréversible.`)) {
      return;
    }

    setDeletingId(id);
    const t = toast.loading("Suppression de l'enregistrement...");

    try {
      const res = await fetch('/api/github-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_text', // Utilise l'action de suppression générique
          textId: id 
        })
      });

      if (res.ok) {
        setPodcasts(prev => prev.filter(p => p.id !== id));
        toast.success("Podcast effacé des archives.", { id: t });
      } else {
        throw new Error();
      }
    } catch (error) {
      toast.error("Échec de la suppression.", { id: t });
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return (
    <div className="flex justify-center p-12">
      <Loader2 className="animate-spin text-indigo-600" size={32} />
    </div>
  );

  if (podcasts.length === 0) return (
    <div className="text-center p-12 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
      <Headphones className="mx-auto text-slate-300 mb-4" size={48} />
      <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">
        Aucun podcast publié pour le moment
      </p>
    </div>
  );

  return (
    <div className="grid gap-4">
      {podcasts.map((podcast) => (
        <div 
          key={podcast.id}
          className="group bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-indigo-400">
              <Headphones size={24} />
            </div>
            
            <div>
              <h4 className="font-black text-slate-900 text-sm md:text-base leading-tight">
                {podcast.title}
              </h4>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                  <Clock size={12} /> {podcast.duration}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                  <Eye size={12} /> {podcast.views || 0} vues
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a 
              href={`/auditorium/${podcast.id}`}
              className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
              title="Écouter"
            >
              <Play size={18} fill="currentColor" />
            </a>
            
            <button 
              onClick={() => handleDelete(podcast.id, podcast.title)}
              disabled={deletingId === podcast.id}
              className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
              title="Supprimer"
            >
              {deletingId === podcast.id ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Trash2 size={18} />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
