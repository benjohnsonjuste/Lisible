"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import AdBanner, { useAdPlacements } from "@/components/AdBanner";
import {
  BookOpen,
  Plus,
  Eye,
  Heart,
  Search,
  Loader2,
  LibraryBig,
} from "lucide-react";

export default function LivresCatalogue() {
  const [livres, setLivres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const adPlacements = useAdPlacements("strip");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/livres", { cache: "no-store" });
        if (!res.ok) throw new Error();
        const json = await res.json();
        setLivres(Array.isArray(json.content) ? json.content : []);
      } catch {
        toast.error("Impossible de charger le catalogue.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = livres.filter((l) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      (l.title || "").toLowerCase().includes(q) ||
      (l.authorName || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#FDFCF8] py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest mb-4">
            <LibraryBig size={14} /> Grand format
          </div>
          <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter text-slate-900">
            Livres
          </h1>
          <p className="mt-4 text-slate-500 max-w-xl mx-auto">
            Des œuvres complètes à savourer page par page, dans un lecteur
            protégé contre la copie.
          </p>
          <Link
            href="/livres/publier"
            className="inline-flex items-center gap-2 mt-8 bg-slate-950 hover:bg-teal-600 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-full px-8 py-4 transition-colors"
          >
            <Plus size={16} /> Publier un livre
          </Link>
        </header>

        <div className="max-w-md mx-auto mb-6">
          <div className="relative">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un titre, un auteur..."
              className="w-full bg-white border border-slate-200 rounded-full pl-12 pr-5 py-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
            />
          </div>
        </div>

        {/* Bannière publicitaire discrète (se replie si vide). */}
        {adPlacements && <AdBanner placement={adPlacements[0]} className="mb-10" />}

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-20">
            <Loader2 className="animate-spin text-teal-600" size={32} />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Chargement du catalogue...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen size={48} className="text-slate-200 mx-auto mb-6" />
            <p className="font-serif italic text-2xl text-slate-400">
              Le catalogue est silencieux.
            </p>
            <p className="mt-3 text-sm text-slate-400">
              Soyez la première plume à y déposer un livre.
            </p>
            <Link
              href="/livres/publier"
              className="inline-flex items-center gap-2 mt-8 bg-teal-600 hover:bg-teal-700 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-full px-8 py-4 transition-colors"
            >
              <Plus size={16} /> Publier un livre
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((l) => (
              <Link
                key={l.id}
                href={`/livres/${l.id}`}
                className="card-lisible group bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 hover:-translate-y-1 transition-transform flex flex-col"
              >
                <div className="flex gap-5">
                  {l.cover ? (
                    <img
                      src={l.cover}
                      alt={l.title}
                      className="w-20 aspect-[2/3] object-cover rounded-xl shadow-md shrink-0"
                    />
                  ) : (
                    <div className="w-20 aspect-[2/3] rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                      <BookOpen size={28} className="text-teal-300" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600 truncate">
                      {l.authorName}
                    </p>
                    <h2 className="text-xl font-black italic tracking-tight text-slate-900 leading-snug mt-1 line-clamp-2">
                      {l.title}
                    </h2>
                  </div>
                </div>
                {l.description ? (
                  <p className="mt-4 text-sm text-slate-500 italic line-clamp-3 flex-1">
                    {l.description}
                  </p>
                ) : (
                  <div className="flex-1" />
                )}
                <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <span className="inline-flex items-center gap-2">
                    <BookOpen size={14} /> {l.pageCount || 0} pages
                  </span>
                  <span className="inline-flex items-center gap-4">
                    <span className="inline-flex items-center gap-1">
                      <Eye size={14} /> {l.views || 0}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Heart size={14} /> {l.likes || 0}
                    </span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
