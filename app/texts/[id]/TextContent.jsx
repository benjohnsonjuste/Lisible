"use client";  
  
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";  
import { useRouter } from "next/navigation";  
import { toast } from "sonner";  
import { Maximize2, Minimize2, ArrowLeft, Eye, Clock, Sun, Zap, Coffee, Ghost, Megaphone, Trophy, Sparkles, Gift, X, Swords } from "lucide-react";  
import FloatingActions from "@/components/reader/FloatingActions";  
import SecurityLock from "@/components/SecurityLock";  
import ReportModal from "@/components/ReportModal";  
import SceauCertification from "@/components/reader/SceauCertification";  
import CommentSection from "@/components/reader/CommentSection";  
import SocialMargins from "@/components/reader/SocialMargins";  
import CadeauLi from "@/components/CadeauLi";  
import InTextAd from "@/components/reader/InTextAd";  
  
// --- COMPOSANTS DE BADGES ---  
function BadgeConcours() {  
  return (  
    <div className="inline-flex items-center gap-2 bg-emerald-700 text-white px-5 py-2.5 rounded-2xl shadow-xl mb-8">  
      <Trophy size={14} className="animate-bounce" />  
      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Duel de Plume</span>  
    </div>  
  );  
}  
  
function BadgeDuelNouvelles() {  
  return (  
    <div className="inline-flex items-center gap-2 bg-teal-600 text-white px-5 py-2.5 rounded-2xl shadow-xl mb-8 border border-teal-400">  
      <Swords size={14} className="animate-pulse" />  
      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Duel des Nouvelles</span>  
    </div>  
  );  
}  
  
function BadgeAnnonce() {  
  return (  
    <div className="inline-flex items-center gap-2 bg-indigo-700 text-white px-5 py-2.5 rounded-2xl shadow-xl mb-8">  
      <Megaphone size={14} className="animate-pulse" />  
      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Annonce Officielle</span>  
    </div>  
  );  
}  
  
const TextContent = ({ id }) => {  
  const router = useRouter();  
  const [data, setData] = useState(null);  
  const [loading, setLoading] = useState(true);  
  const [user, setUser] = useState(null);  
  const [isLiking, setIsLiking] = useState(false);  
  const [authorProfile, setAuthorProfile] = useState(null);  
  const [isReportModalOpen, setReportModalOpen] = useState(false);  
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);  
  const [isFocusMode, setIsFocusMode] = useState(false);  
  const [readingProgress, setReadingProgress] = useState(0);  
    
  const [liveViews, setLiveViews] = useState(0);  
  const viewLogged = useRef(false);  
  
  const moodConfig = useMemo(() => ({  
    melancholic: { bg: "bg-[#0F111A]", text: "text-slate-300", title: "text-white", accent: "text-indigo-400", ui: "bg-indigo-900/30 text-indigo-300", icon: <Ghost size={12}/>, label: "Mélancolique" },  
    luminous: { bg: "bg-[#FCF9F0]", text: "text-[#2C2C2C]", title: "text-slate-900", accent: "text-amber-700", ui: "bg-amber-100 text-amber-800", icon: <Sun size={12}/>, label: "Lumineux" },  
    epic: { bg: "bg-[#1C0A0A]", text: "text-rose-100/80", title: "text-rose-50", accent: "text-rose-500", ui: "bg-rose-900/40 text-rose-300", icon: <Zap size={12}/>, label: "Épique" },  
    soothing: { bg: "bg-[#F4F9F4]", text: "text-slate-800", title: "text-emerald-950", accent: "text-emerald-700", ui: "bg-emerald-100 text-emerald-800", icon: <Coffee size={12}/>, label: "Apaisant" },  
    default: { bg: "bg-white", text: "text-slate-800", title: "text-slate-900", accent: "text-teal-600", ui: "bg-slate-100 text-slate-600", icon: null, label: "Classique" }  
  }), []);  
  
  const mood = useMemo(() => {  
    if (!data?.content) return moodConfig.default;  
    const content = data.content.toLowerCase();  
    const sets = [  
      { key: 'melancholic', words: ['ombre', 'triste', 'nuit', 'mort', 'seul', 'pleure', 'vide', 'silence'] },  
      { key: 'luminous', words: ['soleil', 'joie', 'amour', 'clair', 'vie', 'rire', 'espoir', 'lumière'] },  
      { key: 'epic', words: ['force', 'guerre', 'feu', 'épée', 'sang', 'combat', 'fureur', 'destin'] },  
      { key: 'soothing', words: ['calme', 'paix', 'vent', 'doux', 'plage', 'repos', 'harmonie', 'nature'] }  
    ];  
    const scores = sets.map(s => ({ key: s.key, score: s.words.reduce((acc, word) => acc + (content.split(word).length - 1), 0) }));  
    const topMood = scores.reduce((p, c) => (p.score > c.score) ? p : c);  
    return topMood.score > 1 ? moodConfig[topMood.key] : moodConfig.default;  
  }, [data?.content, moodConfig]);  
  
  const loadContent = useCallback(async () => {  
    if (!id) return;  
    try {  
      const res = await fetch(`https://lisible.biz/api/github-db?type=text&id=${id}`);  
      if (res.ok) {  
        const result = await res.json();  
        const content = result.content;  
        setData(content);  
        setLiveViews(content.views || 0);  
  
        const usersRes = await fetch(`/api/realtime-data?folder=users`);  
        const usersJson = await usersRes.json();  
        const allUsers = Array.isArray(usersJson.content) ? usersJson.content : [];  
        const author = allUsers.find(u => (u.email || "").toLowerCase().trim() === (content.authorEmail || "").toLowerCase().trim());  
        if (author) setAuthorProfile(author.profilePic || author.image || null);  
      }  
    } catch (error) {   
      toast.error("Erreur de chargement");   
    } finally {   
      setLoading(false);   
    }  
  }, [id]);  
  
  useEffect(() => {  
    loadContent();  
    const stored = localStorage.getItem("lisible_user");  
    if (stored) setUser(JSON.parse(stored));  
    const handleScroll = () => {  
      const total = document.documentElement.scrollHeight - window.innerHeight;  
      setReadingProgress(total > 0 ? (window.scrollY / total) * 100 : 0);  
    };  
    window.addEventListener("scroll", handleScroll);  
    return () => window.removeEventListener("scroll", handleScroll);  
  }, [loadContent]);  
  
  const renderedContent = useMemo(() => {  
    if (!data?.content) return null;  
    const paragraphs = data.content.split('\n').filter(p => p.trim() !== "");  
    return (  
      <div className="space-y-8">  
        <div className="whitespace-pre-wrap">  
          {paragraphs.map((p, i) => (  
            <React.Fragment key={i}>  
              <p className="mb-6 leading-relaxed">{p}</p>  
              <InTextAd />  
            </React.Fragment>  
          ))}  
        </div>  
      </div>  
    );  
  }, [data?.content]);  
  
  if (loading) return <div className="flex justify-center items-center min-h-screen font-serif animate-pulse">Immersion en cours...</div>;  
  if (!data) return null;  
  
  const isAnnouncementAccount = ["adm.lablitteraire7@gmail.com", "cmo.lablitteraire7@gmail.com"].includes(data.authorEmail);  
  const isNovelDuel = data.genre === "Duel Des Nouvelles" || data.category === "Duel Des Nouvelles";  
  const isBattlePoetique = data.isConcours === true || ["Battle Poétique", "Battle Poétique International"].includes(data.genre || data.category);  
  
  return (  
    <div className={`min-h-screen transition-all duration-1000 ${isFocusMode ? 'bg-[#050505]' : mood.bg}`}>  
      {/* reste inchangé */}  
    </div>  
  );  
};  
  
export default TextContent;