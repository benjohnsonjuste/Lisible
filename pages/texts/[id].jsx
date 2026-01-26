"use client";
import React, { useEffect, useState } from "react";
import { Loader2, ArrowLeft, Eye } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";

export default function TextPage() {
  const params = useParams();
  const id = params?.id;

  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [readProgress, setReadProgress] = useState(0);

  // 1. CHARGEMENT DU TEXTE
  useEffect(() => {
    const fetchTexte = async () => {
      if (!id) return;
      try {
        const res = await fetch(
          `https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/textes.json?t=${Date.now()}`
        );
        const data = await res.json();
        const found = data.find(t => String(t.id) === String(id));
        if (found) setText(found);
      } catch (e) {
        toast.error("Erreur de connexion");
      } finally {
        setLoading(false);
      }
    };
    fetchTexte();
  }, [id]);

  // 2. BARRE DE PROGRESSION DE LECTURE
  useEffect(() => {
    const updateScroll = () => {
      const h =
        document.documentElement.scrollHeight - window.innerHeight;
      setReadProgress((window.scrollY / h) * 100);
    };
    window.addEventListener("scroll", updateScroll);
    return () => window.removeEventListener("scroll", updateScroll);
  }, []);

  if (loading)
    return (
      <div className="flex flex-col items-center py-40 text-teal-600 bg-slate-50 min-h-screen">
        <Loader2 className="animate-spin mb-4" size={32} />
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">
          Ouverture du manuscrit...
        </span>
      </div>
    );

  if (!text)
    return (
      <div className="py-40 text-center font-bold text-slate-400">
        Texte introuvable.
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto px-4 pb-20 animate-in fade-in duration-700">
      {/* Barre de progression */}
      <div className="fixed top-0 left-0 w-full h-1 z-[60] bg-slate-100">
        <div
          className="h-full bg-teal-500"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      <header className="pt-8 mb-8">
        <Link
          href="/bibliotheque"
          className="inline-flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest"
        >
          <ArrowLeft size={16} /> Bibliothèque
        </Link>
      </header>

      <article className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden p-8 md:p-14">
        <div className="flex items-center justify-between border-b border-slate-50 pb-8 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-teal-400 font-black text-xl shadow-lg">
              {text.authorName?.charAt(0)}
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Auteur
              </p>
              <p className="text-base font-black text-slate-900 italic">
                {text.authorName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl text-slate-600">
            <Eye size={14} className="text-teal-500" />
            <span className="text-xs font-black">
              {text.views || 0}
            </span>
          </div>
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter italic leading-tight mb-10">
          {text.title}
        </h1>

        <div className="text-slate-800 leading-[1.8] font-serif text-xl md:text-2xl whitespace-pre-wrap">
          {text.content}
        </div>
      </article>
    </div>
  );
}