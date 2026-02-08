"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Filter, BookOpen, Clock } from 'lucide-react';

export default function LibraryPage() {
  const [index, setIndex] = useState([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchIndex() {
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/index.json`, { cache: 'no-store' });
      const data = await res.json();
      setIndex(JSON.parse(atob(data.content)));
    }
    fetchIndex();
  }, []);

  const filteredIndex = index.filter(item => 
    (filter === 'All' || item.category === filter) &&
    (item.title.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-white p-4 md:p-12">
      <header className="max-w-7xl mx-auto mb-16">
        <h1 className="text-7xl font-black italic tracking-tighter mb-8">Library.</h1>
        
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by title..." 
              className="w-full pl-12 pr-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-teal-500/20"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <select 
            className="bg-slate-950 text-white px-6 py-4 rounded-2xl font-bold text-sm outline-none"
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="Poetry">Poetry</option>
            <option value="Novel">Novel</option>
            <option value="Essay">Essay</option>
            <option value="Battle">Battle</option>
          </select>
        </div>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredIndex.map((item) => (
          <Link href={`/texts/${item.id}`} key={item.id} className="group border border-slate-100 p-8 rounded-[2.5rem] hover:border-teal-500 transition-all shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
                {item.category}
              </span>
              {item.isConcours && <span className="text-[10px] font-black uppercase text-amber-500">🏆 Contest</span>}
            </div>
            <h3 className="text-2xl font-black italic mb-4 group-hover:text-teal-600 transition-colors">{item.title}</h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-tighter">By {item.author}</p>
            <div className="mt-8 flex items-center gap-4 text-slate-300">
               <div className="flex items-center gap-1 text-[10px]"><Clock size={12}/> {new Date(item.createdAt).toLocaleDateString()}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
