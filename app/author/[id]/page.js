"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  Loader2, ShieldCheck, Award, Heart, Eye, BookOpen, 
  FileText, ExternalLink 
} from 'lucide-react';
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
            className="w-32 h-32 rounded-3xl bg-slate-900 shadow-xl"
            alt=""
          />
          <div className="space-y-2">
            <h1 className="text-4xl font-black italic text-slate-900 tracking-tighter">
                {author.name || author.penName}
            </h1>
            <div className="flex gap-4">
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

      <div className="max-w-5xl mx-auto px-6 mt-12 space-y-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-2xl font-black italic tracking-tighter text-slate-900 flex items-center gap-2">
            <BookOpen size={24} className="text-teal-600" /> Manuscrits & Œuvres.
          </h2>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
            {works.length} Publications
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {works.length > 0 ? works.map((work) => (
            <div key={work.id} className="group bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-teal-200 hover:shadow-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-teal-50 group-hover:text-teal-500 transition-colors">
                  <FileText size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-teal-700 transition-colors tracking-tight">{work.title}</h3>
                    {Number(work.certified) > 0 && <ShieldCheck size={16} className="text-teal-500" />}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span className="text-teal-600 italic">Sceaux : {work.certified || 0}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Eye size={12}/> {work.views || 0} Lectures</span>
                    <span>•</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-500">{work.category || "Littérature"}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Link href={`/texts/${work.id}`} className="p-4 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-900 hover:text-white transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                  Lire l'œuvre <ExternalLink size={18} />
                </Link>
              </div>
            </div>
          )) : (
            <div className="py-20 text-center bg-white rounded-[3.5rem] border border-dashed border-slate-200">
              <p className="text-slate-400 font-medium italic">Aucun manuscrit public pour le moment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
