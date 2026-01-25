"use client";
import React, { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { 
  Heart, Share2, Send, ArrowLeft, Eye, 
  Loader2, Edit3, Check, X 
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
// 1. Importation du composant publicitaire
import AdScript from "@/components/AdScript"; 

export default function TextPage() {
  const params = useParams();
  const id = params?.id;

  const [text, setText] = useState(null);
  const [user, setUser] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const startTimeRef = useRef(null);

  // ... (Garde tes useEffect pour le chargement des données et le scroll progress)

  // ... (Garde tes fonctions handleUpdateContent et handleLike)

  if (loading || !text) return (
    <div className="flex flex-col items-center py-40 text-teal-600">
      <Loader2 className="animate-spin mb-4" />
      <span className="text-[10px] font-black uppercase tracking-widest">Récupération du manuscrit...</span>
    </div>
  );

  const isOwner = user && user.email === text.authorEmail;

  return (
    <div className="max-w-3xl mx-auto px-4 pb-20 space-y-8 animate-in fade-in duration-700">
      {/* Barre de lecture */}
      <div className="fixed top-0 left-0 w-full h-1 z-[60] bg-slate-100">
        <div className="h-full bg-teal-500 transition-all duration-300" style={{ width: `${readProgress}%` }} />
      </div>

      <header className="pt-4 flex justify-between items-center">
        <Link href="/bibliotheque" className="inline-flex items-center gap-2 text-slate-400 hover:text-teal-600 font-black text-[10px] uppercase tracking-widest transition-all">
          <ArrowLeft size={16} /> Bibliothèque
        </Link>
        
        {isOwner && !isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-600 transition-all"
          >
            <Edit3 size={14} /> Modifier mon texte
          </button>
        )}
      </header>

      <article className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden">
        <div className="p-8 md:p-12 space-y-6">
          {/* Header de l'auteur */}
          <div className="flex items-center justify-between border-b border-slate-50 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-teal-400 font-black shadow-lg">
                {text.authorName?.charAt(0)}
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auteur</p>
                <p className="text-sm font-black text-slate-900 italic">{text.authorName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl text-slate-600 border border-slate-100">
              <Eye size={14} className="text-teal-500" />
              <span className="text-xs font-black">{text.views || 0}</span>
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-4">
               {/* ... (Garde ton interface d'édition) */}
            </div>
          ) : (
            <>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter italic leading-tight">{text.title}</h1>
              {text.imageBase64 && <img src={text.imageBase64} className="w-full h-auto rounded-3xl shadow-sm my-6" alt="Couverture" />}
              
              {/* CORPS DU TEXTE */}
              <div className="text-slate-800 leading-relaxed font-serif text-xl md:text-2xl whitespace-pre-wrap pt-4">
                {text.content}
              </div>

              {/* 2. INSERTION DE LA PUBLICITÉ NATIVE */}
              {/* On la place ici pour qu'elle apparaisse juste après la fin de la lecture */}
              <div className="mt-12 pt-8 border-t border-slate-50">
                <AdScript />
              </div>
            </>
          )}
        </div>

        {!isEditing && (
          <footer className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            {/* ... (Garde tes boutons de Like et Share) */}
          </footer>
        )}
      </article>
    </div>
  );
}
