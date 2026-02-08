"use client";
import React, { useEffect, useState } from 'react';
import { UserPlus, UserMinus, Book, Star, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function AuthorProfile({ params }) {
  const [author, setAuthor] = useState(null);
  const [works, setWorks] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const email = atob(params.id);

  useEffect(() => {
    async function loadData() {
      // 1. Charger le profil
      const userRes = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/users/${params.id}.json`, { cache: 'no-store' });
      const userData = await userRes.json();
      setAuthor(JSON.parse(atob(userData.content)));

      // 2. Charger les œuvres depuis l'index
      const indexRes = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/index.json`, { cache: 'no-store' });
      const indexData = await indexRes.json();
      const allWorks = JSON.parse(atob(indexData.content));
      setWorks(allWorks.filter(w => w.authorEmail === email));
    }
    loadData();
  }, [email, params.id]);

  const toggleSubscribe = async () => {
    // Logique API: Ajouter l'email de l'utilisateur actuel dans la liste 'subscribersList' de l'auteur
    setIsSubscribed(!isSubscribed);
    toast.success(isSubscribed ? "Unsubscribed" : "Subscribed to " + author.penName);
  };

  if (!author) return <div className="p-20 text-center font-black">LOADING CATALOG...</div>;

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-slate-950 text-white py-24 px-6 text-center">
        <img src={author.profilePic} className="w-32 h-32 rounded-full mx-auto mb-6 border-4 border-teal-500/20 shadow-2xl" />
        <h1 className="text-6xl font-black italic tracking-tighter mb-2">{author.penName}</h1>
        <p className="text-teal-400 font-bold uppercase text-[10px] tracking-[0.4em] mb-8">{author.role || 'Writer'}</p>
        
        <button 
          onClick={toggleSubscribe}
          className={`px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isSubscribed ? 'bg-white/10 text-white' : 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'}`}
        >
          {isSubscribed ? <><UserMinus size={14} className="inline mr-2"/> Unsubscribe</> : <><UserPlus size={14} className="inline mr-2"/> Subscribe</>}
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-20">
        <div className="flex items-center gap-4 mb-12">
          <Book className="text-teal-500" />
          <h2 className="text-3xl font-black italic">Published Works.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {works.map((work) => (
            <Link href={`/texts/${work.id}`} key={work.id} className="group p-8 border-2 border-slate-50 rounded-[2.5rem] hover:border-teal-500 transition-all">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{work.category}</span>
                {work.isConcours && <Sparkles className="text-amber-400" size={16}/>}
              </div>
              <h3 className="text-2xl font-black italic group-hover:text-teal-600 transition-colors">{work.title}</h3>
              <div className="mt-6 flex gap-4 text-[10px] font-bold text-slate-300 uppercase">
                 <span>Read Time: 5 min</span>
                 <span>•</span>
                 <span>{new Date(work.createdAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
