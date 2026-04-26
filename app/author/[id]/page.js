"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, ShieldCheck, BookOpen, Users, Star, ArrowRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const GITHUB = { owner: "benjohnsonjuste", repo: "Lisible" };

export default function AuthorCataloguePage() {
  const params = useParams();
  const router = useRouter();
  const [author, setAuthor] = useState(null);
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const logged = localStorage.getItem("lisible_user");
    if (logged) try { setCurrentUser(JSON.parse(logged)); } catch (e) {}
    if (params.id) loadAuthorData();
  }, [params.id]);

  async function loadAuthorData() {
    try {
      setLoading(true);
      const email = decodeURIComponent(params.id).toLowerCase().trim();

      // 1. Charger le profil utilisateur (GitHub API ou RAW)
      const resUser = await fetch(`https://raw.githubusercontent.com/${GITHUB.owner}/${GITHUB.repo}/main/data/users/${email}.json`);
      if (!resUser.ok) throw new Error("Auteur introuvable");
      const userData = await resUser.json();
      setAuthor(userData);

      // 2. Charger les publications en temps réel depuis index.json
      const resPubs = await fetch(`https://raw.githubusercontent.com/${GITHUB.owner}/${GITHUB.repo}/main/data/publications/index.json`);
      if (resPubs.ok) {
        const pubsData = await resPubs.json();
        const authorWorks = (Array.isArray(pubsData) ? pubsData : (pubsData.content || [])).filter(
          (p) => p.authorEmail?.toLowerCase().trim() === email
        );
        setWorks(authorWorks);
      }
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  const handleFollow = async () => {
    if (!currentUser) return toast.error("Connectez-vous pour suivre cette plume");
    if (currentUser.email === author.email || (author.followers || []).includes(currentUser.email)) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/github-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "follow", userEmail: currentUser.email, targetEmail: author.email })
      });
      if (res.ok) {
        setAuthor(p => ({ ...p, followers: [...(p.followers || []), currentUser.email] }));
        toast.success("Abonné !");
      }
    } catch (e) { toast.error("Erreur"); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FCFBF9]"><Loader2 className="animate-spin text-teal-600" size={40} /></div>;
  if (error) return <div className="min-h-screen flex flex-col items-center justify-center bg-[#FCFBF9] p-6 text-center"><h2 className="text-2xl font-black mb-4">Oups ! {error}</h2><button onClick={() => router.back()} className="text-teal-600 font-bold flex gap-2"><ArrowLeft size={18} /> Retour</button></div>;

  const isFollowing = (author.followers || []).includes(currentUser?.email);
  const isOwnProfile = currentUser?.email === author.email;

  return (
    <div className="min-h-screen bg-[#FCFBF9]">
      <div className="bg-white border-b border-slate-100 pt-20 pb-12">
        <div className="max-w-5xl mx-auto px-6">
          <button onClick={() => router.back()} className="mb-8 text-slate-400 hover:text-slate-900 flex items-center gap-2 text-xs font-black uppercase tracking-widest"><ArrowLeft size={14} /> Retour</button>
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="w-40 h-40 rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white bg-slate-100 flex-shrink-0">
              <img src={author.profilePic || author.image || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${author.email}`} alt={author.name} className="w-full h-full object-cover" />
            </div>
            <div className="text-center md:text-left grow">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-4xl font-black italic tracking-tighter text-slate-900">{author.penName || author.name}</h1>
                {author.certified > 0 && <ShieldCheck className="text-teal-500" fill="currentColor" />}
              </div>
              <p className="text-slate-500 max-w-xl mb-6 font-medium">{author.bio || "Cette plume n'a pas encore rédigé sa présentation."}</p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 mb-8">
                <div className="flex items-center gap-2"><BookOpen size={18} className="text-teal-500" /><span className="text-sm font-black">{works.length} Œuvres</span></div>
                <div className="flex items-center gap-2"><Users size={18} className="text-teal-500" /><span className="text-sm font-black">{(author.followers || []).length} Abonnés</span></div>
                <div className="flex items-center gap-2"><Star size={18} className="text-amber-500" /><span className="text-sm font-black">{author.li || 0} Li</span></div>
              </div>
              {!isOwnProfile && <button onClick={handleFollow} disabled={submitting || isFollowing} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isFollowing ? "bg-slate-100 text-slate-400" : "bg-slate-950 text-white hover:bg-teal-600 shadow-lg"}`}>{submitting ? <Loader2 size={14} className="animate-spin" /> : isFollowing ? "Abonné" : "Suivre cette plume"}</button>}
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h3 className="text-xl font-black uppercase tracking-[0.2em] text-slate-400 mb-10">Manuscrits publiés</h3>
        {works.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-12 text-center border-2 border-dashed border-slate-100"><p className="text-slate-400 font-bold italic">Aucune œuvre publiée pour le moment.</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {works.map((work) => (
              <Link key={work.id} href={`/texts/${work.id}`} className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all flex justify-between items-center">
                <div><h4 className="text-xl font-black text-slate-900 group-hover:text-teal-600 transition-colors">{work.title}</h4><p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{work.category || "Littérature"}</p></div>
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-all"><ArrowRight size={20} /></div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
