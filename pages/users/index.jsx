"use client";
import { useEffect, useState } from "react";
import { Mail, Users as UsersIcon, BookOpen, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function UsersPage() {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await fetch("https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/users");
        const files = await res.json();
        
        if (Array.isArray(files)) {
          const dataPromises = files
            .filter(file => file.name.endsWith('.json'))
            .map(file => fetch(file.download_url).then(r => r.json()));
          
          const allUsers = await Promise.all(dataPromises);
          setAuthors(allUsers.sort((a, b) => a.name.localeCompare(b.name)));
        }
      } catch (e) {
        console.error("Erreur", e);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10">
      <header className="mb-12">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-100">
            <UsersIcon size={28} />
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Communauté</h1>
        </div>
        <p className="text-gray-500 ml-16">Découvrez les auteurs qui font vivre Lisible.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {authors.map((a, index) => (
          <div key={index} className="group bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-inner">
                  {a.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 text-lg leading-tight">{a.name}</h2>
                  <div className="flex items-center gap-1 text-gray-400 text-sm mt-1">
                    <Mail size={14} />
                    {a.email}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Membre depuis {a.joinedAt ? new Date(a.joinedAt).toLocaleDateString() : "toujours"}
              </div>
              
              {/* BOUTON DE FILTRE */}
              <Link 
                href={`/bibliotheque?author=${encodeURIComponent(a.name)}`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-black hover:bg-blue-600 hover:text-white transition-all group"
              >
                <BookOpen size={14} />
                VOIR SES TEXTES
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
