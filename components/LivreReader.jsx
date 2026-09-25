"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  BookOpen,
  Loader2,
  Lock,
} from "lucide-react";
import SecurityLock from "./SecurityLock";
import GiftBar from "./economie/GiftBar";
import AdBanner from "./AdBanner";
import { INTEXT_MOBILE, INTEXT_DESKTOP } from "./adsterraPlacements";

export default function LivreReader({ id }) {
  const [livre, setLivre] = useState(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [isMobile, setIsMobile] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/livres?id=${encodeURIComponent(id)}`, { cache: "no-store" });
        if (!res.ok) throw new Error("introuvable");
        const json = await res.json();
        if (!cancelled) setLivre(json.content);
        fetch("/api/livres", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, action: "view" }),
        }).catch(() => {});
      } catch {
        if (!cancelled) toast.error("Ce livre est introuvable.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const total = livre && Array.isArray(livre.pages) ? livre.pages.length : 0;

  const go = useCallback(
    (d) => setPage((p) => Math.min(Math.max(p + d, 0), Math.max(total - 1, 0))),
    [total]
  );

  useEffect(() => {
    const h = (e) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [go]);

  // Détection mobile/desktop (choix des tailles de bannières in-text).
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const like = async () => {
    if (liked || !livre) return;
    setLiked(true);
    try {
      const res = await fetch("/api/livres", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "like" }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok && typeof j.count === "number") {
        setLivre((l) => ({ ...l, likes: j.count }));
        toast.success("Merci pour votre appréciation !");
      }
    } catch {}
  };

  const paragraphs = String((livre && livre.pages[page]) || "")
    .split(/\n\s*\n/)
    .filter(Boolean);
  const progress = total > 0 ? ((page + 1) / total) * 100 : 0;

  // Bannières in-text discrètes, réparties uniformément sur la page du livre.
  // Contrainte Adsterra : un code = UN SEUL slot par page.
  // (useMemo placé avant les returns précoces — règle des hooks.)
  const adMap = useMemo(() => {
    const map = new Map();
    if (isMobile === null) return map;
    const slots = [];
    paragraphs.forEach((_, i) => { if ((i + 1) % 2 === 0) slots.push(i); });
    const placements = isMobile ? INTEXT_MOBILE : INTEXT_DESKTOP;
    const n = Math.min(placements.length, slots.length);
    for (let j = 0; j < n; j++) {
      const sIdx = n === 1 ? 0 : Math.round((j * (slots.length - 1)) / (n - 1));
      map.set(slots[sIdx], placements[j]);
    }
    return map;
  }, [paragraphs, isMobile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-teal-600" size={32} />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          Ouverture du livre...
        </p>
      </div>
    );
  }

  if (!livre) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex flex-col items-center justify-center gap-6 px-4">
        <BookOpen size={48} className="text-slate-200" />
        <p className="text-slate-500 font-serif italic text-xl">Ce livre est introuvable.</p>
        <Link
          href="/livres"
          className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600 hover:text-teal-700"
        >
          Retour au catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8]">
      <div className="fixed top-0 left-0 h-1 bg-teal-500 z-50 transition-all" style={{ width: `${progress}%` }} />

      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        <Link
          href="/livres"
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 mb-8"
        >
          <ArrowLeft size={14} /> Catalogue
        </Link>

        <header className="text-center mb-10">
          {livre.cover ? (
            <img
              src={livre.cover}
              alt={livre.title}
              className="w-36 aspect-[2/3] object-cover rounded-2xl shadow-xl mx-auto mb-6"
            />
          ) : null}
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600 mb-3">
            {livre.authorName}
          </p>
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-slate-900 font-serif">
            {livre.title}
          </h1>
          {livre.description ? (
            <p className="mt-4 text-slate-500 italic max-w-xl mx-auto">{livre.description}</p>
          ) : null}
          <div className="mt-6 flex items-center justify-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <span className="inline-flex items-center gap-2">
              <BookOpen size={14} /> {total} pages
            </span>
            <span className="inline-flex items-center gap-2">
              <Eye size={14} /> {livre.views || 0} lectures
            </span>
            <button
              onClick={like}
              className={`inline-flex items-center gap-2 transition-colors ${liked ? "text-rose-500" : "hover:text-rose-500"}`}
            >
              <Heart size={14} fill={liked ? "currentColor" : "none"} /> {livre.likes || 0}
            </button>
          </div>
          <p className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
            <Lock size={12} /> Contenu protégé contre la copie
          </p>
        </header>

        <SecurityLock>
          <article className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8 md:p-14 min-h-[60vh]">
            <div className="prose-lisible font-serif text-lg leading-loose text-slate-800">
              {paragraphs.map((p, i) => (
                <React.Fragment key={`${page}-${i}`}>
                  <p className="mb-6 text-justify">{p}</p>
                  {/* Bannière in-text discrète. Le composant se replie
                      automatiquement si la bannière reste vide. */}
                  {adMap.has(i) && <AdBanner placement={adMap.get(i)} className="my-3" />}
                </React.Fragment>
              ))}
            </div>
            <p className="text-center mt-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
              — {livre.title} —
            </p>
          </article>
        </SecurityLock>

        <div className="mt-8 flex items-center justify-between gap-4">
          <button
            onClick={() => go(-1)}
            disabled={page === 0}
            className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 disabled:opacity-30 hover:border-teal-500 hover:text-teal-600 transition-colors"
          >
            <ChevronLeft size={16} /> Précédente
          </button>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Page {page + 1} / {total}
          </span>
          <button
            onClick={() => go(1)}
            disabled={page >= total - 1}
            className="inline-flex items-center gap-2 bg-slate-950 rounded-full px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white disabled:opacity-30 hover:bg-teal-600 transition-colors"
          >
            Suivante <ChevronRight size={16} />
          </button>
        </div>

        <p className="text-center mt-8 text-[10px] uppercase tracking-[0.2em] text-slate-300 font-black">
          Utilisez les flèches du clavier pour tourner les pages
        </p>

        {/* Soutenir l'auteur */}
        {livre.authorEmail && (
          <GiftBar
            destinataire={{ email: livre.authorEmail, nom: livre.authorName || "l'auteur" }}
            contexte={{ type: "lecture", refId: id, refTitre: livre.title }}
          />
        )}
      </div>
    </div>
  );
}
