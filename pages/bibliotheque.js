"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Heart, MessageCircle, BookOpen, User, Loader2 } from "lucide-react";

export default function Bibliotheque() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications?t=${Date.now()}`);
        const files = await res.json();
        if (Array.isArray(files)) {
          const promises = files.filter(f => f.name.endsWith('.json')).map(f => fetch(f.download_url).then(r => r.json()));
          const data = await Promise.all(promises);
          setTexts(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-40"><Loader2 className="animate-spin text-teal-600" size={40}/></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 grid gap-8 md:grid-cols-2 lg:grid-cols-2">
      {texts.map((item) => (
        <Link href={`/texts/${item.id}`} key={item.id} className="group">
          <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-xl hover:shadow-teal-100/40 transition-all duration-500 h-full flex flex-col">
            <div className="h-52 bg-slate-100 relative">
              <img src={item.imageBase64 || "/api/placeholder/400/320"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            </div>
            <div className="p-8 flex-grow">
              <h2 className="text-2xl font-black italic text-slate-900 group-hover:text-teal-600 transition-colors mb-3">{item.title}</h2>
              <p className="text-slate-500 line-clamp-2 font-serif italic mb-6">{item.content}</p>
              <div className="flex items-center justify-between pt-6 border-t border-slate-50 mt-auto">
                <span className="font-black text-[10px] uppercase text-teal-600">@{item.authorName}</span>
                <div className="flex gap-4 text-slate-400 font-bold text-xs">
                  <span className="flex items-center gap-1"><Eye size={14}/> {item.views}</span>
                  <span className="flex items-center gap-1"><Heart size={14} className="text-rose-500"/> {item.likes?.length || 0}</span>
                  <span className="flex items-center gap-1"><MessageCircle size={14} className="text-blue-500"/> {item.comments?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
