"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, LogOut, BookText, ChevronRight, MessageSquare, Heart, Sparkles } from "lucide-react";
import QuickActions from "@/components/QuickActions";

export default function AuthorDashboard() {
  const [user, setUser] = useState(null);
  const [myTexts, setMyTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loggedUser = localStorage.getItem("lisible_user");
    
    if (!loggedUser) {
      router.push("/login");
    } else {
      const parsedUser = JSON.parse(loggedUser);
      setUser(parsedUser);
      fetchMyTexts(parsedUser.name);
    }
  }, [router]);

  const fetchMyTexts = async (authorName) => {
    try {
      const res = await fetch("https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications");
      const files = await res.json();
      
      if (Array.isArray(files)) {
        const dataPromises = files
          .filter(file => file.name.endsWith('.json'))
          .map(async (file) => {
            const content = await fetch(file.download_url).then(r => r.json());
            const id = file.name.replace(".json", "");
            return { ...content, id };
          });
        
        const allTexts = await Promise.all(dataPromises);
        const filtered = allTexts.filter(t => t.authorName === authorName);
        setMyTexts(filtered.sort((a, b) => new Date(b.date) - new Date(a.date)));
      }
    } catch (e) {
      console.error("Erreur chargement mes textes", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("lisible_user");
    router.push("/login");
  };

  if (loading) return (
    <div className="flex justify-center items-center py-20 text-teal-600">
      <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-current"></div>
    </div>
  );

  return (
    <div className="space-y-10">
      {/* Header Profil */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 card-lisible ring-1 ring-slate-100">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 bg-teal-50 rounded-[1.8rem] flex items-center justify-center text-teal-600 shadow-inner border border-teal-100/50">
              {user?.profilePic ? (
                <img src={user.profilePic} alt="" className="w-full h-full object-cover rounded-[1.8rem]" />
              ) : (
                <User size={36} />
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full shadow-sm">
              <Sparkles size={14} className="text-amber-400" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 leading-tight italic">
              Salut, {user?.penName || user?.name?.split(' ')[0]} !
            </h1>
            <p className="text-teal-600/70 text-xs font-black uppercase tracking-[0.2em] mt-1">Espace Auteur</p>
          </div>
        </div>
        
        <button 
          onClick={handleLogout} 
          className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all font-black text-xs uppercase tracking-widest"
        >
          <LogOut size={18} /> Quitter
        </button>
      </header>

      {/* Raccourcis (Publier, etc.) */}
      <QuickActions />

      {/* Section Mes Publications */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-lg text-white">
              <BookText size={16} />
            </div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">
              Mes publications ({myTexts.length})
            </h2>
          </div>
          <Link href={`/bibliotheque?author=${encodeURIComponent(user?.name)}`} className="text-[10px] font-black text-teal-600 uppercase tracking-widest hover:underline">
            Tout voir
          </Link>
        </div>

        {myTexts.length === 0 ? (
          <div className="bg-white p-16 rounded-[3rem] border-2 border-dashed border-slate-100 text-center space-y-4">
            <p className="text-slate-400 font-medium">Votre plume n'a pas encore laissé de trace ici.</p>
            <Link href="/publish" className="btn-lisible text-xs">
              ÉCRIRE MON PREMIER TEXTE
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {myTexts.slice(0, 5).map((text, idx) => (
              <div key={idx} className="group card-lisible p-5 flex items-center justify-between hover:border-teal-200 hover:shadow-lg hover:shadow-teal-100/20 transition-all border-slate-50">
                <div className="flex-grow space-y-2">
                  <h3 className="font-black text-lg text-slate-800 group-hover:text-teal-600 transition-colors italic leading-tight">
                    {text.title}
                  </h3>
                  <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full text-red-400">
                        <Heart size={12} fill="currentColor" /> {text.likesCount || 0}
                    </span>
                    <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full text-teal-500">
                        <MessageSquare size={12} fill="currentColor" /> {(text.comments || []).length}
                    </span>
                    <span className="hidden sm:block opacity-60">
                        {new Date(text.date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
                <Link 
                  href={`/texts/${text.id}`} 
                  className="ml-4 p-4 bg-slate-50 rounded-2xl text-slate-300 group-hover:bg-teal-600 group-hover:text-white transition-all shadow-sm"
                >
                  <ChevronRight size={20} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
