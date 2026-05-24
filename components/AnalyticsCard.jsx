'use client';
import React from 'react';

export default function AnalyticsCard({ title, icon: Icon, color, children, height = "auto" }) {
  const colorStyles = {
    indigo: "border-indigo-900/30 text-indigo-400",
    purple: "border-purple-900/30 text-purple-400",
    amber: "border-amber-900/30 text-amber-400",
    teal: "border-teal-900/30 text-teal-400",
    blue: "border-blue-900/30 text-blue-400",
    orange: "border-orange-900/30 text-orange-400",
    fuchsia: "border-fuchsia-900/30 text-fuchsia-400"
  };

  return (
    <div className={`bg-slate-900 border ${colorStyles[color] || "border-slate-800"} rounded-xl p-6 space-y-3 transition-all hover:border-slate-700`}>
      <h3 className="text-xs uppercase font-mono tracking-wider flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" />} {title}
      </h3>
      <div className={height}>{children}</div>
    </div>
  );
}
