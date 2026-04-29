"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
ArrowLeft, BookOpen, Loader2, Coins, ChevronRight, HeartHandshake, ShieldCheck, Crown, Share2
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
export default function AuthorProfile() {
const router = useRouter();
const params = useParams();
// Décoder l'email/id de l'URL
const authorEmailId = decodeURIComponent(params.id || "");
const [author, setAuthor] = useState(null);
const [texts, setTexts] = useState([]);
const [loading, setLoading] = useState(true);
const [globalMaxViews, setGlobalMaxViews] = useState(0);
const fetchAuthorData = useCallback(async (id) => {
setLoading(true);
try {
const authorEmail = id.toLowerCase().trim();
// Transformation de l'email pour correspondre au format fichier : nom_gmail_com.json
const fileName = authorEmail.replace('@', '').replace(/./g, '');
// 1. Récupérer les infos de l'auteur
const userRes = await fetch(`/api/github-db?type=user&id=${fileName}`);
const userData = await userRes.json();
if (userData?.content) {
setAuthor(userData.content);
}
// 2. Récupérer les publications et calculer les stats globales
const indexRes = await fetch(`/api/github-db?type=library`);
const indexData = await indexRes.json();
if (indexData?.content) {
const viewsMap = indexData.content.reduce((acc, pub) => {
const email = pub.authorEmail?.toLowerCase();
acc[email] = (acc[email] || 0) + Number(pub.views || 0);
return acc;
}, {});
setGlobalMaxViews(Math.max(...Object.values(viewsMap), 0));
const authorWorks = indexData.content.filter(
t => t.authorEmail?.toLowerCase().trim() === authorEmail
);
setTexts(authorWorks);
}
} catch (e) {
toast.error("Auteur introuvable");
} finally {
setLoading(false);
}
}, []);
useEffect(() => {
if (authorEmailId) fetchAuthorData(authorEmailId);
}, [authorEmailId, fetchAuthorData]);
const handleShare = async () => {
const shareData = {
title: author?.penName || author?.name,
text: `Découvrez les œuvres de ${author?.penName || author?.name} sur Lisible ✨`,
url: window.location.href
};
if (navigator.share) {
try { await navigator.share(shareData); } catch (e) {}
} else {
navigator.clipboard.writeText(window.location.href);
toast.success("Lien copié !");
}
};
if (loading) return <div className="h-screen flex items-center justify-center bg-[#FCFBF9]"><Loader2 className="animate-spin text-teal-600" /></div>;
if (!author) return <div className="min-h-screen flex items-center justify-center italic text-slate-400">Profil introuvable.</div>;
const totalViews = texts.reduce((s, t) => s + Number(t.views || 0), 0);
const isElite = totalViews === globalMaxViews && globalMaxViews > 0;
return (
<div className="max-w-5xl mx-auto px-6 py-12 bg-[#FCFBF9] min-h-screen space-y-16">
{/* Header Style Ancien */}
<header className="relative flex flex-col md:flex-row items-center gap-10 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl">
<button onClick={() => router.back()} className="absolute top-8 left-8 p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
<ArrowLeft size={20} />
</button>
<div className="w-40 h-40 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl relative">
<img
src={author?.image || `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${author?.email}`}
className="w-full h-full object-cover"
alt={author?.penName}
/>
{isElite && <div className="absolute inset-0 border-4 border-amber-400 rounded-[2.5rem] animate-pulse" />}
</div>
<div className="text-center md:text-left grow space-y-4">
<h1 className="text-5xl font-black text-slate-900 tracking-tighter italic flex items-center gap-3 justify-center md:justify-start">
{author?.penName || author?.name}
{(author?.certified > 0 || author?.totalCertifications > 0) && <ShieldCheck className="text-teal-500" size={28} />}
</h1>
<div className="flex flex-wrap gap-2 justify-center md:justify-start">
{isElite && (
<div className="bg-slate-950 text-amber-400 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
<Crown size={12}/> Élite
</div>
)}
<div className="bg-teal-50 text-teal-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">
<Coins size={12} className="inline mr-1"/> {author?.li || author?.totalCertifications || 0} Li
</div>
</div>
</div>
<div className="flex flex-col gap-3 w-full md:w-auto">
<Link
href={`/donate?to=${btoa(author?.email || "")}`}
className="bg-rose-600 text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-600/20 hover:bg-slate-900 transition-all"
>
<HeartHandshake size={18} /> Soutenir
</Link>
<button 
onClick={handleShare} 
className="bg-white border-2 border-slate-100 p-4 rounded-2xl flex items-center justify-center hover:bg-slate-50 transition-all"
>
<Share2 size={18}/>
</button>
</div>
</header>
{/* Grille des Œuvres Style Ancien */}
<div className="space-y-6">
<h2 className="text-xl font-black italic flex items-center gap-2 px-4">
<BookOpen size={20} className="text-teal-600"/> Ses Écrits.
</h2>
<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
{texts.length > 0 ? texts.map(txt => (
<Link href={`/texts/${txt.id}`} key={txt.id} className="group p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all">
<h3 className="text-2xl font-black text-slate-900 group-hover:text-teal-600 transition-colors italic mb-4">
{txt.title}
</h3>
<div className="flex justify-between items-center pt-4 border-t border-slate-50">
<span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
{txt.views || 0} Lectures
</span>
<ChevronRight size={18} className="text-slate-200 group-hover:text-teal-600 transition-all" />
</div>
</Link>
)) : (
<div className="md:col-span-2 text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
<p className="text-slate-400 italic font-serif">Aucun manuscrit public n'a encore été scellé par cet auteur.</p>
</div>
)}
</div>
</div>
</div>
);
}
