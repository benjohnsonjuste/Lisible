"use client";
import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";

export default function NotificationBell() {
  const [hasUnread, setHasUnread] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 1. Récupérer l'utilisateur connecté
    const loggedUser = localStorage.getItem("lisible_user");
    if (loggedUser) {
      const userData = JSON.parse(loggedUser);
      setUser(userData);
      checkNewNotifications(userData.email);
    }

    // Optionnel : Vérifier toutes les 2 minutes
    const interval = setInterval(() => {
      if (user) checkNewNotifications(user.email);
    }, 120000);

    return () => clearInterval(interval);
  }, []);

  const checkNewNotifications = async (userEmail) => {
    try {
      // 2. Charger les notifications depuis GitHub (anti-cache avec le timestamp)
      const res = await fetch(`https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/notifications.json?t=${Date.now()}`);
      if (!res.ok) return;
      
      const allNotifs = await res.json();

      // 3. Filtrer les notifs qui concernent cet utilisateur
      const myNotifs = allNotifs.filter(n => 
        n.targetEmail === null || 
        (n.targetEmail && n.targetEmail.toLowerCase() === userEmail.toLowerCase())
      );

      if (myNotifs.length > 0) {
        // 4. Comparer avec la dernière notification vue stockée localement
        const lastSeenId = localStorage.getItem("last_notif_id");
        const latestId = myNotifs[0].id.toString();

        if (lastSeenId !== latestId) {
          setHasUnread(true);
        } else {
          setHasUnread(false);
        }
      }
    } catch (error) {
      console.error("Erreur check bell:", error);
    }
  };

  return (
    <Link
      href="/notifications"
      className="relative cursor-pointer hover:scale-110 transition-transform flex items-center justify-center p-1"
      title="Voir les notifications"
    >
      <Bell className="w-7 h-7 text-white hover:text-yellow-400 transition-colors" />

      {/* 🔔 Indicateur rouge dynamique */}
      {hasUnread && (
        <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-indigo-900 animate-pulse"></span>
      )}
    </Link>
  );
}
