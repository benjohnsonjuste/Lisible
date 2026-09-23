"use client";

import { statusLabel } from "./api";

const STYLES = {
  draft: "bg-slate-100 text-slate-600",
  open: "bg-teal-50 text-teal-700",
  assigned: "bg-blue-50 text-blue-700",
  delivered: "bg-amber-50 text-amber-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-slate-100 text-slate-500",
  disputed: "bg-red-50 text-red-700",
  refunded: "bg-orange-50 text-orange-700",
};

export default function StatusBadge({ status, className = "" }) {
  const cls = STYLES[status] || STYLES.draft;
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${cls} ${className}`}
    >
      {statusLabel(status)}
    </span>
  );
}
