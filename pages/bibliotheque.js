"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Heart, MessageCircle, BookOpen, Calendar, User, Loader2 } from "lucide-react";

export default function Bibliotheque() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications?t=${Date.now()}`);
      const files = await res.json();
      if (Array.isArray(files)) {
        const promises = files.filter(f => f.name.endsWith('.json')).map(f => fetch(f.download_url).then(r => r.json()));
        const data = await Promise.all(promises);
        setTexts(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-40"><Loader2 className="animate-spin text-teal-600" size={40}/></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 grid gap-8 md:grid-cols-2">
      {texts.map((item) => (
        <Link href={`/texts/${item.id}`} key={item.id} className="group">
          <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-xl hover:shadow-teal-100/50 transition-all duration-500">
            <div className="h-60 bg-slate-100 overflow-hidden relative">
              <img src={item.imageBase64 || "/default.jpg"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <Calendar size={12} className="text-teal-600"/> {new Date(item.date).toLocaleDateString()}
              </div>
            </div>
            <div className="p-8 space-y-4">
              <h2 className="text-2xl font-black italic text-slate-900 group-hover:text-teal-600 transition-colors">{item.title}</h2>
              <p className="text-slate-500 line-clamp-2 font-serif italic text-lg">{item.content}</p>
              <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                <div className="flex items-center gap-2 font-black text-[10px] uppercase text-slate-400">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-teal-400 flex items-center justify-center"><User size={14}/></div>
                  {item.authorName}
                </div>
                <div className="flex gap-4 text-slate-400 font-bold text-xs">
                  <span className="flex items-center gap-1"><Eye size={16} className="text-teal-500"/> {item.views}</span>
                  <span className="flex items-center gap-1"><Heart size={16} className="text-rose-500"/> {item.likes?.length || 0}</span>
                  <span className="flex items-center gap-1"><MessageCircle size={16} className="text-blue-500"/> {item.comments?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
