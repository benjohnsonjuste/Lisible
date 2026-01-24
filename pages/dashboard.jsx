"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { User, LayoutDashboard, LogOut, BookText, ChevronRight, MessageSquare, Heart } from "lucide-react";
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
          .map(file => fetch(file.download_url).then(r => r.json()));
        
        const allTexts = await Promise.all(dataPromises);
        // Filtrer pour ne garder que les textes de l'utilisateur connecté
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
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
            <User size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 leading-tight">Bonjour, {user?.name} !</h1>
            <p className="text-gray-400 text-sm font-medium">Tableau de bord de l'auteur</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 px-6 py-3 bg-gray-50 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all font-bold text-sm">
          <LogOut size={18} /> Déconnexion
        </button>
      </header>

      <QuickActions />

      {/* Section Mes Publications */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <BookText size={20} className="text-blue-600" />
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">Mes écrits ({myTexts.length})</h2>
          </div>
          <Link href={`/bibliotheque?author=${encodeURIComponent(user?.name)}`} className="text-xs font-bold text-blue-600 hover:underline">
            Voir tout
          </Link>
        </div>

        {myTexts.length === 0 ? (
          <div className="bg-white p-12 rounded-[2.5rem] border-2 border-dashed border-gray-100 text-center">
            <p className="text-gray-400 text-sm mb-4">Vous n'avez pas encore publié de texte.</p>
            <Link href="/publish" className="text-blue-600 font-black text-sm">Écrire ma première histoire →</Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {myTexts.slice(0, 3).map((text, idx) => (
              <div key={idx} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
                <div className="flex-grow">
                  <h3 className="font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{text.title}</h3>
                  <div className="flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1"><Heart size={12} className="text-red-400" /> {text.likesCount || 0}</span>
                    <span className="flex items-center gap-1"><MessageSquare size={12} className="text-blue-400" /> {(text.comments || []).length}</span>
                    <span>{new Date(text.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <Link href={`/texts/${text.id || text.title.toLowerCase().replace(/ /g, "-")}`} className="p-3 bg-gray-50 rounded-xl text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
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
