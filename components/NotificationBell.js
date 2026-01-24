"use client";
import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";

export default function NotificationBell() {
  const [hasUnread, setHasUnread] = useState(false);
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    // 1. Récupérer la session utilisateur au montage
    const loggedUser = localStorage.getItem("lisible_user");
    if (loggedUser) {
      const userData = JSON.parse(loggedUser);
      setUserEmail(userData.email);
      // Lancement immédiat de la vérification
      checkNewNotifications(userData.email);
    }

    // 2. Vérification périodique toutes les 2 minutes
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
      // 3. Appel au fichier centralisé avec protection anti-cache
      const res = await fetch(
        `https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/notifications.json?t=${new Date().getTime()}`
      );
      
      if (!res.ok) return;
      
      const allNotifs = await res.json();

      // 4. Filtrage : Public ou Personnel
      const myNotifs = allNotifs.filter(n => 
        n.targetEmail === null || 
        (n.targetEmail && n.targetEmail.toLowerCase() === email.toLowerCase())
      );

      if (myNotifs.length > 0) {
        // 5. Comparaison avec le dernier ID lu enregistré par la page /notifications
        const lastSeenId = localStorage.getItem("last_notif_id");
        const latestId = myNotifs[0].id.toString();

        // Si l'ID le plus récent n'est pas celui stocké, on allume la cloche
        setHasUnread(lastSeenId !== latestId);
      } else {
        setHasUnread(false);
      }
    } catch (error) {
      console.error("Erreur de synchronisation cloche:", error);
    }
  };

  return (
    <Link
      href="/notifications"
      className="relative cursor-pointer hover:scale-110 active:scale-95 transition-all flex items-center justify-center p-1"
      title="Notifications"
    >
      <Bell 
        className={`w-7 h-7 transition-colors ${hasUnread ? 'text-yellow-400' : 'text-white hover:text-gray-200'}`} 
      />

      {/* 🔔 Indicateur rouge animé */}
      {hasUnread && (
        <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border-2 border-indigo-900"></span>
        </span>
      )}
    </Link>
  );
}
