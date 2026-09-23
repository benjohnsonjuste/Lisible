"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Star, BadgeCheck, Briefcase, ExternalLink, Languages, Wallet, ArrowRight } from "lucide-react";
import { apiGet, formatDateFR } from "@/components/freelance/api";
import Money from "@/components/freelance/Money";

export default function ProProfilePage({ params }) {
  const { email } = React.use(params);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const j = await apiGet("get_pro", { email });
      setData(j);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => { load(); }, [load]);

  const profile = data?.profile;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 min-h-screen bg-[#FCFBF9]">
      <Link href="/marketplace" className="text-sm font-bold text-teal-700 hover:underline mb-6 inline-block">
        ← Retour à l&apos;Espace Freelance
      </Link>

      {loading && (
        <div className="text-center py-16">
          <div className="inline-block w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium mt-4">Chargement du profil…</p>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 text-sm font-bold">
          {error}
        </div>
      )}

      {!loading && profile && (
        <>
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm mb-6">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-black tracking-tighter text-slate-900">{profile.name}</h1>
                  {profile.verified && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full">
                      <BadgeCheck size={14} /> Profil vérifié
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                    <Star size={16} fill="currentColor" />
                    {profile.ratingAvg ? Number(profile.ratingAvg).toFixed(1) : "—"}
                    <span className="text-slate-400 font-medium">· {profile.ratingCount || 0} avis</span>
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="inline-flex items-center gap-1.5 text-slate-500 font-medium">
                    <Briefcase size={15} className="text-teal-600" />
                    {profile.completedCount || 0} missions terminées
                  </span>
                </div>
              </div>
            </div>

            {profile.bio && (
              <p className="text-slate-700 leading-relaxed whitespace-pre-line mb-6">{profile.bio}</p>
            )}

            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              {(profile.specialties || []).length > 0 && (
                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Spécialités</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.specialties.map((s) => (
                      <span key={s} className="text-[11px] font-bold uppercase tracking-wide bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {(profile.languages || []).length > 0 && (
                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2 inline-flex items-center gap-1.5">
                    <Languages size={13} className="text-teal-600" /> Langues
                  </p>
                  <p className="font-bold text-slate-900">{profile.languages.join(", ")}</p>
                </div>
              )}
              {profile.priceHint != null && (
                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2 inline-flex items-center gap-1.5">
                    <Wallet size={13} className="text-teal-600" /> Tarif indicatif
                  </p>
                  <p className="font-black text-teal-700 text-lg"><Money amount={profile.priceHint} /></p>
                </div>
              )}
            </div>

            {(profile.portfolio || []).length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">Portfolio</p>
                <div className="space-y-2">
                  {profile.portfolio.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm font-bold text-teal-700 hover:underline">
                      <ExternalLink size={14} /> {url}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Avis */}
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-teal-700 mb-4">Avis reçus</h2>
            {(data.reviews || []).length === 0 ? (
              <p className="text-sm text-slate-400 italic">Aucun avis pour le moment.</p>
            ) : (
              <div className="space-y-4">
                {data.reviews.map((r) => (
                  <div key={r.id} className="bg-slate-50 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-sm text-slate-900">{r.authorName}</p>
                      <p className="text-xs text-slate-400">{formatDateFR(r.at)}</p>
                    </div>
                    <div className="flex gap-0.5 mb-2">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} size={14} className={n <= r.rating ? "text-amber-500" : "text-slate-300"} fill={n <= r.rating ? "currentColor" : "none"} />
                      ))}
                    </div>
                    {r.comment && <p className="text-sm text-slate-700">{r.comment}</p>}
                    {r.taskTitle && <p className="text-xs text-slate-400 mt-2">Mission : {r.taskTitle}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 bg-teal-600 text-white px-8 py-3.5 rounded-2xl font-black hover:bg-teal-700 transition-all"
          >
            Voir les missions ouvertes <ArrowRight size={16} />
          </Link>
        </>
      )}
    </div>
  );
}
