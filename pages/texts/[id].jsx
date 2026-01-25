"use client";
import React, { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { 
  Heart, Share2, Send, ArrowLeft, Eye, 
  Loader2, Edit3, Check, X 
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function TextPage() {
  const params = useParams();
  const id = params?.id;

  const [text, setText] = useState(null);
  const [user, setUser] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editTitle, setEditTitle] = useState("");

  // 1. CHARGEMENT DU TEXTE
  useEffect(() => {
    const fetchTexte = async () => {
      if (!id) return;
      try {
        const storedUser = localStorage.getItem("lisible_user");
        if (storedUser) setUser(JSON.parse(storedUser));

        const res = await fetch(`https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/textes.json?t=${Date.now()}`);
        const data = await res.json();
        const found = data.find(t => String(t.id) === String(id));
        
        if (found) {
          setText(found);
          setEditContent(found.content);
          setEditTitle(found.title);
        }
      } catch (e) {
        console.error("Erreur de chargement", e);
      } finally {
        setLoading(false);
      }
    };
    fetchTexte();
  }, [id]);

  // 2. INJECTION DU SCRIPT PUBLICITAIRE (Méthode Blogger)
  useEffect(() => {
    if (!loading && text && !isEditing) {
      // Création du script
      const script = document.createElement("script");
      script.src = "https://pl28554024.effectivegatecpm.com/874a186feecd3e968c16a58bb085fd56/invoke.js";
      script.async = true;
      script.setAttribute("data-cfasync", "false");
      
      // Injection dans le body
      document.body.appendChild(script);

      return () => {
        // Nettoyage lors du changement de page
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, [loading, text, isEditing]);

  // 3. BARRE DE PROGRESSION
  useEffect(() => {
    const updateProgress = () => {
      const scrollH = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollH > 0) {
        setReadProgress((window.scrollY / scrollH) * 100);
      }
    };
    window.addEventListener("scroll", updateProgress);
    return () => window.removeEventListener("scroll", updateProgress);
  }, []);

  if (loading || !text) return (
    <div className="flex flex-col items-center py-40 text-teal-600">
      <Loader2 className="animate-spin mb-4" />
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Récupération du manuscrit...</span>
    </div>
  );

  const isOwner = user && user.email === text.authorEmail;

  return (
    <div className="max-w-3xl mx-auto px-4 pb-20 space-y-8 animate-in fade-in duration-700">
      <div className="fixed top-0 left-0 w-full h-1 z-[60] bg-slate-100">
        <div className="h-full bg-teal-500 transition-all duration-300" style={{ width: `${readProgress}%` }} />
      </div>

      <header className="pt-8 flex justify-between items-center">
        <Link href="/bibliotheque" className="inline-flex items-center gap-2 text-slate-400 hover:text-teal-600 font-black text-[10px] uppercase tracking-widest transition-all">
          <ArrowLeft size={16} /> Bibliothèque
        </Link>
        
        {isOwner && !isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-600 transition-all shadow-lg"
          >
            <Edit3 size={14} /> Modifier
          </button>
        )}
      </header>

      <article className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden">
        <div className="p-8 md:p-14 space-y-8">
          {/* Header de l'auteur */}
          <div className="flex items-center justify-between border-b border-slate-50 pb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-teal-400 font-black text-xl shadow-inner">
                {text.authorName?.charAt(0)}
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Auteur</p>
                <p className="text-base font-black text-slate-900 italic leading-none">{text.authorName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl text-slate-500 border border-slate-100">
              <Eye size={14} className="text-teal-500" />
              <span className="text-xs font-black">{text.views || 0}</span>
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-6">
               {/* Ici insère ton interface d'édition */}
               <p className="text-center text-slate-400 text-xs italic">Mode édition actif...</p>
            </div>
          ) : (
            <>
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter italic leading-tight">
                {text.title}
              </h1>
              
              {text.imageBase64 && (
                <img src={text.imageBase64} className="w-full h-auto rounded-[2rem] shadow-sm my-8" alt="Couverture" />
              )}
              
              <div className="text-slate-800 leading-[1.8] font-serif text-xl md:text-2xl whitespace-pre-wrap pt-4">
                {text.content}
              </div>

              {/* ZONE PUBLICITAIRE (TON CODE BLOGGER) */}
              <div className="mt-20 pt-10 border-t border-slate-100 flex flex-col items-center">
                <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.4em] mb-6">Sponsorisé par le label</p>
                
                {/* TON DIV ID UNIQUE */}
                <div id="container-874a186feecd3e968c16a58bb085fd56" className="w-full min-h-[250px] flex items-center justify-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                   <span className="text-[9px] text-slate-200 uppercase font-black tracking-widest animate-pulse">Chargement partenaire...</span>
                </div>
              </div>
            </>
          )}
        </div>

        {!isEditing && (
          <footer className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <button className="flex items-center gap-2 text-slate-400 hover:text-rose-500 transition-colors">
               <Heart size={20} /> <span className="text-xs font-bold">Aimer</span>
            </button>
            <button className="flex items-center gap-2 text-slate-400 hover:text-teal-500 transition-colors">
               <Share2 size={20} /> <span className="text-xs font-bold">Partager</span>
            </button>
          </footer>
        )}
      </article>
    </div>
  );
}
