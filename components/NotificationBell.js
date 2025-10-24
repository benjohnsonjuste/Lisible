"use client";

import { Bell } from "lucide-react";
import Link from "next/link";

export default function NotificationBell() {
  return (
    <Link
      href="/notifications"
      className="relative cursor-pointer hover:scale-110 transition-transform"
      title="Voir les notifications"
    >
      <Bell className="w-8 h-8 text-white hover:text-yellow-400 transition-colors" />

      {/* 🔔 Indicateur rouge si nouvelles notifications */}
      <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
    </Link>
  );
}