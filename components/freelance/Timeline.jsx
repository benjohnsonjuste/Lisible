"use client";

import { formatDateFR } from "./api";

// Frise chronologique : events [{at, actor, event, detail}]
export default function Timeline({ events = [] }) {
  if (!events.length) {
    return <p className="text-sm text-slate-400 italic">Aucun événement pour le moment.</p>;
  }
  return (
    <ol className="relative border-l-2 border-teal-100 ml-2 space-y-5">
      {events.map((e, i) => (
        <li key={i} className="ml-5 relative">
          <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-teal-600 ring-4 ring-teal-50" />
          <p className="text-xs font-bold uppercase tracking-wide text-teal-700">{e.event}</p>
          <p className="text-sm text-slate-700 font-medium">{e.detail || ""}</p>
          <p className="text-xs text-slate-400">
            {formatDateFR(e.at)}
            {e.actor ? ` · ${e.actor}` : ""}
          </p>
        </li>
      ))}
    </ol>
  );
}
