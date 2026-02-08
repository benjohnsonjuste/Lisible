"use client";
import React, { useEffect, useState } from 'react';
import { Search, Users, Coins, ArrowRight, ShieldCheck, Crown, Briefcase } from 'lucide-react';
import Link from 'next/link';

export default function CommunityPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchUsers() {
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/users`, { cache: 'no-store' });
      const files = await res.json();
      const data = await Promise.all(
        files.filter(f => f.name.endsWith('.json')).map(async f => {
          const r = await fetch(f.download_url);
          return r.json();
        })
      );
      setUsers(data.sort((a, b) => (b.wallet?.balance || 0) - (a.wallet?.balance || 0)));
    }
    fetchUsers();
  }, []);

  const getBadge = (email) => {
    if (email === "jb7management@gmail.com") return { label: "CEO", color: "bg-slate-950 text-amber-400", icon: <Crown size={10}/> };
    if (email === "robergeaurodley97@gmail.com") return { label: "DG", color: "bg-blue-600 text-white", icon: <Briefcase size={10}/> };
    if (email === "cmo.lablitteraire7@gmail.com") return { label: "STAFF", color: "bg-teal-600 text-white", icon: <ShieldCheck size={10}/> };
    return null;
  };

  const filtered = users.filter(u => (u.penName || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <header className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
        <h1 className="text-7xl font-black italic tracking-tighter">Community.</h1>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input 
            type="text" placeholder="Find a writer..." 
            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl pl-12 py-4 font-bold outline-none focus:border-teal-500/20"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((u) => {
          const badge = getBadge(u.email);
          return (
            <div key={u.email} className="bg-white border border-slate-100 p-8 rounded-[3rem] shadow-sm hover:shadow-xl transition-all group">
              <div className="flex items-center gap-6 mb-8">
                <div className="relative">
                  <img 
                    src={u.profilePic || `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${u.email}`} 
                    className="w-20 h-20 rounded-full bg-slate-100 object-cover" 
                  />
                  {badge && (
                    <div className={`absolute -top-2 -right-2 px-2 py-1 rounded-lg text-[8px] font-black flex items-center gap-1 ${badge.color}`}>
                      {badge.icon} {badge.label}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-black italic tracking-tighter">{u.penName}</h2>
                  <div className="flex gap-3 mt-1">
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Users size={12}/> {u.stats?.subscribers || 0}</span>
                    <span className="text-[10px] font-bold text-teal-600 flex items-center gap-1"><Coins size={12}/> {u.wallet?.balance || 0} Li</span>
                  </div>
                </div>
              </div>
              <Link href={`/author/${btoa(u.email)}`} className="block w-full text-center py-4 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-600 transition-colors">
                Voir le catalogue
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
