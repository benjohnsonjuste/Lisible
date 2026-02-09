"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Bell, Heart, MessageSquare, Clock, 
  ArrowLeft, Sparkles, Loader2, 
  RefreshCw, Coins, Award
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import Pusher from "pusher-js";

/**
 * PAGE SIGNAUX (NOTIFICATIONS)
 * Gère l'affichage des interactions sociales et des gains de Li.
 */
export default function NotificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const notifsRef = useRef([]);

  // Récupération des IDs déjà lus dans le stockage local
  useEffect(() => {
    const savedReadIds = JSON.parse(localStorage.getItem("read_notifications") || "[]");
    setReadIds(savedReadIds);
  }, []);

  // --- RÉCUPÉRATION VIA GITHUB-DB ---
  const fetchNotifications = useCallback(async (userEmail, silent = false) => {
    if (!userEmail) return;
    if (!silent) setLoading(true);
    else setIsSyncing(true);

    try {
      // On interroge l'API GitHub-DB pour obtenir le profil utilisateur et ses signaux
      const res = await fetch(`/api/github-db?action=get-user&id=${userEmail.toLowerCase().trim()}`);
      
      if (res.ok) {
        const data = await res.json();
        // Structure attendue : data.content.notifications
        const myNotifs = data.user?.notifications || [];
        
        const sorted = myNotifs.sort((a, b) => new Date(b.date) - new Date(a.date));
        setNotifications(sorted);
        notifsRef.current = sorted;
      }
    } catch (error) { 
      console.error("Erreur de synchronisation des signaux:", error); 
    } finally { 
      setLoading(false); 
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    const loggedUser = localStorage.getItem("lisible_user");
    let interval;

    if (loggedUser) {
      const userData = JSON.parse(loggedUser);
      setUser(userData);
      
      fetchNotifications(userData.email);

      // --- PUSHER (Temps Réel) ---
      const pusher = new Pusher('1da55287e2911ceb01dd', { cluster: 'us2' });
      // Création d'une clé de canal unique basée sur l'email
      const userKey = btoa(userData.email.toLowerCase().trim()).replace(/=/g, "");
      const privateChannel = pusher.subscribe(`user-${userKey}`);
      
      const handleNewNotif = (newNotif) => {
        setNotifications(prev => {
          if (prev.find(n => n.id === newNotif.id)) return prev;
          const updated = [newNotif, ...prev];
          notifsRef.current = updated;
          return updated;
        });
        toast("Signal reçu", { 
          description: newNotif.message,
          icon: <Bell size={16} className="text-teal-500" />
        });
      };

      privateChannel.bind('new-alert', handleNewNotif);

      // Fallback : rafraîchissement manuel toutes les 60s
      interval = setInterval(() => fetchNotifications(userData.email, true), 60000);

      return () => {
        if (interval) clearInterval(interval);
        pusher.unsubscribe(`user-${userKey}`);
      };
    } else {
      router.push("/auth");
    }
  }, [fetchNotifications, router]);

  const markAsRead = (id) => {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      setReadIds(updated);
      localStorage.setItem("read_notifications", JSON.stringify(updated));
    }
  };

  const getIcon = (type, isRead) => {
    const cls = isRead ? "opacity-40" : "";
    switch (type) {
      case 'gain': return <Coins size={20} className={`${cls} text-amber-500`} />;
      case 'badge': return <Award size={20} className={`${cls} text-teal-500`} />;
      case 'like': return <Heart size={20} className={`${cls} text-rose-500 fill-rose-500`} />;
      case 'comment': return <MessageSquare size={20} className={`${cls} text-sky-500`} />;
      default: return <Bell size={20} className={`${cls} text-slate-400`} />;
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-[#FCFBF9] dark:bg-slate-950">
      <Loader2 className="animate-spin text-teal-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Interception des fréquences...</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-12 px-6 min-h-screen animate-in fade-in duration-1000">
      
      <header className="flex items-center justify-between mb-12">
        <button 
          onClick={() => router.back()} 
          className="p-4 bg-white dark:bg-slate-900 rounded-[1.2rem] border border-slate-100 dark:border-white/5 shadow-sm hover:scale-105 active:scale-95 transition-all text-slate-600 dark:text-slate-400"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
            <h1 className="text-2xl font-black italic tracking-tighter text-slate-950 dark:text-white">Signaux</h1>
            {isSyncing && (
              <div className="flex items-center justify-center gap-2 mt-1">
                <RefreshCw size={10} className="animate-spin text-teal-500" />
                <span className="text-[8px] font-black uppercase tracking-widest text-teal-600/50">Sync</span>
              </div>
            )}
        </div>
        <div className="relative">
          <div className="w-12 h-12 flex items-center justify-center bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-full shadow-xl">
             <Bell size={18} />
          </div>
          {notifications.some(n => !readIds.includes(n.id)) && (
             <span className="absolute -top-1 -right-1 w-4 h-4 bg-teal-500 border-2 border-[#FCFBF9] dark:border-slate-950 rounded-full animate-pulse" />
          )}
        </div>
      </header>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 text-slate-300 dark:text-slate-800 gap-6">
            <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-full">
              <Sparkles size={40} className="opacity-20" />
            </div>
            <p className="font-black uppercase text-[10px] tracking-[0.4em]">Silence radio</p>
          </div>
        ) : (
          notifications.map((n) => (
            <Link 
              href={n.link || "/account"} 
              key={n.id} 
              onClick={() => markAsRead(n.id)} 
              className={`flex items-start gap-5 p-6 rounded-[2.5rem] border transition-all duration-500 ${
                readIds.includes(n.id) 
                  ? 'bg-slate-50/50 dark:bg-slate-900/20 border-transparent opacity-60' 
                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-xl shadow-slate-200/50 dark:shadow-none hover:border-teal-500/30'
              }`}
            >
              <div className="shrink-0 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center">
                {getIcon(n.type, readIds.includes(n.id))}
              </div>
              
              <div className="flex-grow pt-1">
                <p className={`text-[15px] leading-relaxed ${readIds.includes(n.id) ? 'text-slate-500' : 'text-slate-900 dark:text-white font-bold'}`}>
                  {n.message}
                </p>
                
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock size={12} />
                    <span className="text-[9px] font-black uppercase tracking-widest">
                      {new Date(n.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  
                  {n.amountLi > 0 && (
                    <div className="px-3 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center gap-1.5 border border-amber-100 dark:border-amber-900/30">
                      <Coins size={10} className="text-amber-600" />
                      <span className="text-[10px] font-black text-amber-700">+{n.amountLi} Li</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <footer className="py-20 text-center">
         <p className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-300 dark:text-slate-800">
           Fin de transmission
         </p>
      </footer>
    </div>
  );
}
