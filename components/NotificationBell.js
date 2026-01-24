"use client";
import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";

export default function NotificationBell() {
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    const loggedUser = localStorage.getItem("lisible_user");
    if (loggedUser) {
      const userData = JSON.parse(loggedUser);
      checkNewNotifications(userData.email);
    }

    const interval = setInterval(() => {
      const currentUser = localStorage.getItem("lisible_user");
      if (currentUser) {
        const email = JSON.parse(currentUser).email;
        checkNewNotifications(email);
      }
    }, 120000);

    return () => clearInterval(interval);
  }, []);

  const checkNewNotifications = async (email) => {
    if (!email) return;
    try {
      const res = await fetch(
        `https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/notifications.json?t=${Date.now()}`
      );
      if (!res.ok) return;
      
      const allNotifs = await res.json();
      const myNotifs = allNotifs.filter(n => 
        n.targetEmail === null || 
        (n.targetEmail && n.targetEmail.toLowerCase() === email.toLowerCase())
      );

      if (myNotifs.length > 0) {
        const lastSeenId = localStorage.getItem("last_notif_id");
        const latestId = myNotifs[0].id.toString();
        setHasUnread(lastSeenId !== latestId);
      } else {
        setHasUnread(false);
      }
    } catch (error) {
      console.error("Erreur synchro cloche:", error);
    }
  };

  return (
    <Link
      href="/notifications"
      className="relative group p-3 bg-slate-50 text-slate-500 hover:bg-teal-50 hover:text-teal-600 rounded-2xl transition-all active:scale-90 border border-slate-100 shadow-sm"
      title="Centre de notifications"
    >
      <Bell 
        size={22}
        className={`transition-all duration-500 ${hasUnread ? 'animate-[swing_2s_ease-in-out_infinite]' : ''}`} 
      />

      {/* 🔴 Point de notification Lisible */}
      {hasUnread && (
        <span className="absolute top-2.5 right-2.5 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500 border-2 border-white"></span>
        </span>
      )}

      {/* Style additionnel pour l'animation de balancement (swing) */}
      <style jsx global>{`
        @keyframes swing {
          0% { transform: rotate(0deg); }
          10% { transform: rotate(15deg); }
          20% { transform: rotate(-10deg); }
          30% { transform: rotate(5deg); }
          40% { transform: rotate(-5deg); }
          50% { transform: rotate(0deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
    </Link>
  );
}
