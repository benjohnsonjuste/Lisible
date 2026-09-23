"use client";

import Link from "next/link";
import { Star, BadgeCheck, Briefcase } from "lucide-react";
import Money from "./Money";

export default function ProCard({ pro }) {
  return (
    <Link
      href={`/marketplace/pro/${encodeURIComponent(pro.email)}`}
      className="block bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-900 text-lg">{pro.name}</h3>
          {pro.verified && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
              <BadgeCheck size={13} /> Vérifié
            </span>
          )}
        </div>
      </div>
      {pro.bio && <p className="text-sm text-slate-500 line-clamp-2 mb-3">{pro.bio}</p>}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {(pro.specialties || []).slice(0, 4).map((s) => (
          <span key={s} className="text-[11px] font-bold uppercase tracking-wide bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
            {s}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="inline-flex items-center gap-1 font-bold text-amber-600">
          <Star size={15} fill="currentColor" />
          {pro.ratingAvg ? Number(pro.ratingAvg).toFixed(1) : "—"}
          <span className="text-slate-400 font-medium">({pro.ratingCount || 0} avis)</span>
        </span>
        <span className="inline-flex items-center gap-1.5 text-slate-500 font-medium">
          <Briefcase size={14} className="text-teal-600" />
          {pro.completedCount || 0} missions
        </span>
      </div>
      {pro.priceHint && (
        <p className="text-xs text-slate-400 mt-2">Tarif indicatif : <Money amount={pro.priceHint} /></p>
      )}
    </Link>
  );
}
