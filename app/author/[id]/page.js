"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Loader2, ArrowLeft, ShieldCheck, Mail, 
  BookOpen, Users, Star, ArrowRight 
} from "lucide-react";
import Link from "next/link";

export default function AuthorCataloguePage() {
  const params = useParams();
  const router = useRouter();
  const [author, setAuthor] = useState(null);
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (params.id) {
      loadAuthorData();
    }
  }, [params.id]);

  async function loadAuthorData() {
    try {
      setLoading(true);
      // 1. Décoder l'ID (email) provenant de l'URL
      const email = decodeURIComponent(params.id);

      // 2. Récupérer le profil de l'auteur
      const resUser = await fetch(`/api/github-db?type=user&id=${encodeURIComponent(email)}`);
      const userData = await resUser.json();

      if (!resUser.ok || !userData.content) {
        throw new Error("Auteur introuvable");
      }

      setAuthor(userData.content);

      // 3. Récupérer l'index des publications pour filtrer ses œuvres
      const resPubs = await fetch(`/api/github-db?type=publications`);
      const pubsData = await resPubs.json();

      if (pubsData && Array.isArray(pubsData.content)) {
        const authorWorks = pubsData.content.filter(
          (p) => p.authorEmail?.toLowerCase() === email.toLowerCase()
        );
        setWorks(authorWorks);
      }

    } catch (err) {
      console.error("Erreur chargement auteur:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FCFBF9]">
      <Loader2 className="animate-spin text-teal-600" size={40} />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FCFBF9] p-6 text-center">
      <h2 className="text-2xl font-black text-slate-900 mb-4">Oups ! {error}</h2>
      <button onClick={() => router.back()} className="text-teal-600 font-bold flex items-center gap-2">
        <ArrowLeft size={18} /> Retourner au Cercle
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FCFBF9]">
      {/* Header Profil */}
      <div className="bg-white border-b border-slate-100 pt-20 pb-12">
        <div className="max-w-5xl mx-auto px-6">
          <button onClick={() => router.back()} className="mb-8 text-slate-400 hover:text-slate-900 transition-colors flex items-center gap-2 text-xs font-black uppercase tracking-widest">
            <ArrowLeft size={14} /> Retour
          </button>

          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="w-40 h-40 rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white bg-slate-100 flex-shrink-0">
              <img 
                src={author.profilePic || author.image || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${author.email}`} 
                alt={author.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="text-center md:text-left grow">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-4xl font-black italic tracking-tighter text-slate-900">
                  {author.penName || author.name}
                </h1>
                {author.certified > 0 && <ShieldCheck className="text-teal-500" fill="currentColor" />}
              </div>
              
              <p className="text-slate-500 max-w-xl mb-6 font-medium">
                {author.bio || "Cette plume n'a pas encore rédigé sa présentation."}
              </p>

              <div className="flex flex-wrap justify-center md:justify-start gap-6">
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className="text-teal-500" />
                  <span className="text-sm font-black">{works.length} Œuvres</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-teal-500" />
                  <span className="text-sm font-black">{(author.followers || []).length} Abonnés</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star size={18} className="text-amber-500" />
                  <span className="text-sm font-black">{author.li || 0} Li</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Catalogue des œuvres */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h3 className="text-xl font-black uppercase tracking-[0.2em] text-slate-400 mb-10">Manuscrits & Publications</h3>
        
        {works.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-12 text-center border-2 border-dashed border-slate-100">
            <p className="text-slate-400 font-bold italic">Aucune œuvre publiée pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {works.map((work) => (
              <Link 
                key={work.id} 
                href={`/texts/${work.id}`}
                className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-teal-500/20 transition-all flex justify-between items-center"
              >
                <div>
                  <h4 className="text-xl font-black text-slate-900 group-hover:text-teal-600 transition-colors">{work.title}</h4>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{work.category || "Littérature"}</p>
                </div>
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-all">
                  <ArrowRight size={20} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
