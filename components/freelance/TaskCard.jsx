"use client";

import Link from "next/link";
import { Tag, CalendarDays, User } from "lucide-react";
import StatusBadge from "./StatusBadge";
import Money from "./Money";
import { formatDateFR } from "./api";

export default function TaskCard({ task }) {
  return (
    <Link
      href={`/marketplace/missions/${task.id}`}
      className="block bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <StatusBadge status={task.status} />
        <Money amount={task.budget} currency={task.currency || "CAD"} className="font-black text-teal-700 text-lg" />
      </div>
      <h3 className="font-bold text-slate-900 text-lg leading-snug mb-2">{task.title}</h3>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
        <span className="inline-flex items-center gap-1.5">
          <Tag size={13} className="text-teal-600" />
          {task.category}
        </span>
        {task.writerName && (
          <span className="inline-flex items-center gap-1.5">
            <User size={13} className="text-teal-600" />
            {task.writerName}
          </span>
        )}
        {task.createdAt && (
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={13} className="text-teal-600" />
            {formatDateFR(task.createdAt)}
          </span>
        )}
      </div>
    </Link>
  );
}
