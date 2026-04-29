"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, ShieldCheck, Award, Heart, Eye, BookOpen, Users } from 'lucide-react';
import Link from 'next/link';

export default function AuthorProfile() {
  const params = useParams();
  const authorEmail = decodeURIComponent(params.id); 
  
  const [author, setAuthor] = useState(null);
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAuthorData() {
      try {
        const cleanEmail = authorEmail.toLowerCase().trim();
        // Transformation de l'email pour correspondre au format fichier : nom_gmail_com.json
        const fileName = cleanEmail.replace('@', '_').replace(/\./g, '_');
        
        const userRes = await fetch(`/api/github-db?type=user&id=${fileName}`);
        if (userRes.ok) {
          const userData = await userRes.json();
          setAuthor(userData.content);
        }

        const pubRes = await fetch(`/api/github-db?type=library`);
        if (pubRes.ok) {
          const pubData = await pubRes.json();
          const authorWorks = (pubData.content || []).filter(
            w => w.authorEmail?.toLowerCase().trim() === cleanEmail
          );
          setWorks(authorWorks);
        }
      } catch (e) {
        console.error("Erreur profil:", e);
      } finally {
        setLoading(false);
      }
    }
    if (authorEmail) fetchAuthorData();
  }, [authorEmail]);

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-teal-600" /></div>;
  if (!author) return <div className="min-h-screen flex items-center justify-center italic text-slate-400">Profil introuvable.</div>;

  return (
    <div className="min-h-screen bg-[#FCFBF9] pb-20">
      <div className="bg-white border-b border-slate-100 p-10">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-8">
          <img 
            src={`https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${author.email}`} 
            className="w-32 h-32 rounded-3xl bg-slate-900"
            alt=""
          />
          <div className="space-y-2">
            <h1 className="text-4xl font-black italic text-slate-900">{author.name || author.penName}</h1>
            <div className="flex gap-4">
              {/* Utilisation de 'li' ou 'totalCertifications' selon ce qui est dispo */}
              <span className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-400">
                <Award size={14} className="text-amber-500" /> {author.totalCertifications || author.li || 0} Points Li
              </span>
              <span className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-400">
                <Heart size={14} className="text-rose-500" /> {author.totalLikes || 0} Likes
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-12 space-y-6">
        <h2 className="text-xl font-black italic flex items-center gap-2"><BookOpen size={20}/> Œuvres publiées</h2>
        <div className="grid gap-4">
          {works.map(work => (
            <Link href={`/texts/${work.id}`} key={work.id}>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 hover:shadow-lg transition-all flex justify-between items-center">
                <span className="font-bold text-slate-800">{work.title}</span>
                <div className="flex gap-3 text-slate-300 text-xs font-bold">
                  <span className="flex items-center gap-1"><Eye size={14}/> {work.views || 0}</span>
                  <span className="flex items-center gap-1"><Heart size={14}/> {work.likes || 0}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
