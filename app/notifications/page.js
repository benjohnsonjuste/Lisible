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

export default function NotificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const notifsRef = useRef([]);

  useEffect(() => {
    const savedReadIds = JSON.parse(localStorage.getItem("read_notifications") || "[]");
    setReadIds(savedReadIds);
  }, []);

  // --- RÉCUPÉRATION DEPUIS LE PROFIL UTILISATEUR ---
  const fetchNotifications = useCallback(async (userEmail, silent = false) => {
    if (!userEmail) return;
    if (!silent) setLoading(true);
    else setIsSyncing(true);

    try {
      const fileName = btoa(userEmail.toLowerCase().trim()).replace(/=/g, "");
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/users/${fileName}.json?t=${Date.now()}`);
      
      if (res.ok) {
        const fileData = await res.json();
        const userData = JSON.parse(atob(fileData.content));
        const myNotifs = userData.notifications || [];
        
        const sorted = myNotifs.sort((a, b) => new Date(b.date) - new Date(a.date));
        setNotifications(sorted);
        notifsRef.current = sorted;
      }
    } catch (error) { 
      console.error("Erreur Sync:", error); 
    } finally { 
      setLoading(false); 
      setIsSyncing(false);
    }
  }, []);

  // --- DÉCLENCHEUR DE NETTOYAGE ---
  const triggerCleanup = useCallback(async (email) => {
    try {
      await fetch("/api/clean-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
    } catch (e) {
      console.error("Cleanup error silencieux");
    }
  }, []);

  useEffect(() => {
    const loggedUser = localStorage.getItem("lisible_user");
    let interval;

    if (loggedUser) {
      const userData = JSON.parse(loggedUser);
      setUser(userData);
      
      fetchNotifications(userData.email);

      const cleanupTimer = setTimeout(() => {
        triggerCleanup(userData.email);
      }, 5000);

      interval = setInterval(() => {
        fetchNotifications(userData.email, true);
      }, 30000);

      // --- PUSHER (Temps Réel) ---
      const pusher = new Pusher('1da55287e2911ceb01dd', { cluster: 'us2' });
      const userKey = btoa(userData.email.toLowerCase().trim()).replace(/=/g, "");
      const privateChannel = pusher.subscribe(`user-${userKey}`);
      
      const handleNewNotif = (newNotif) => {
        setNotifications(prev => {
          if (prev.find(n => n.id === newNotif.id)) return prev;
          const updated = [newNotif, ...prev];
          notifsRef.current = updated;
          return updated;
        });
        toast("Nouveau signal", { description: newNotif.message });
      };

      privateChannel.bind('new-alert', handleNewNotif);

      return () => {
        if (interval) clearInterval(interval);
        clearTimeout(cleanupTimer);
        pusher.unsubscribe(`user-${userKey}`);
      };
    } else {
      setLoading(false);
      router.push("/login");
    }
  }, [fetchNotifications, router, triggerCleanup]);

  const markAsRead = (id) => {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      setReadIds(updated);
      localStorage.setItem("read_notifications", JSON.stringify(updated));
    }
  };

  const getIcon = (type, isRead) => {
    const cls = isRead ? "text-slate-300 dark:text-slate-700" : "";
    switch (type) {
      case 'gain': return <Coins size={20} className={`${cls || "text-amber-500 animate-bounce"}`} />;
      case 'badge': return <Award size={20} className={`${cls || "text-teal-500 animate-pulse"}`} />;
      case 'like': return <Heart size={20} className={`${cls || "text-rose-500 fill-rose-500"}`} />;
      case 'comment': return <MessageSquare size={20} className={`${cls || "text-blue-500"}`} />;
      default: return <Bell size={20} className={`${cls || "text-slate-400 dark:text-slate-500"}`} />;
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-white dark:bg-slate-950">
      <Loader2 className="animate-spin text-teal-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Interception des fréquences...</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 min-h-screen animate-in fade-in duration-700">
      <header className="flex items-center justify-between mb-10">
        <button onClick={() => router.back()} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-900 dark:text-white">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
            <h1 className="text-2xl font-black italic text-slate-900 dark:text-white">Signaux</h1>
            {isSyncing && <RefreshCw size={10} className="animate-spin mx-auto mt-1 text-teal-500" />}
        </div>
        <div className="relative">
          <div className="w-12 h-12 flex items-center justify-center bg-slate-900 dark:bg-teal-600 rounded-full text-white shadow-lg">
             <Bell size={18} />
          </div>
          {notifications.some(n => !readIds.includes(n.id)) && (
             <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 border-2 border-white dark:border-slate-950 rounded-full animate-pulse" />
          )}
        </div>
      </header>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-300 dark:text-slate-800 gap-4">
            <Sparkles size={40} className="opacity-20" />
            <p className="font-black uppercase text-[10px] tracking-widest">Zone de silence radio</p>
          </div>
        ) : (
          notifications.map((n) => (
            <Link 
              href={n.link || "/account"} 
              key={n.id} 
              onClick={() => markAsRead(n.id)} 
              className={`flex items-start gap-5 p-6 rounded-[2.5rem] border transition-all duration-300 ${
                readIds.includes(n.id) 
                  ? 'bg-slate-50/50 dark:bg-slate-900/30 border-transparent opacity-60' 
                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-xl dark:shadow-none'
              }`}
            >
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5">{getIcon(n.type, readIds.includes(n.id))}</div>
              <div className="flex-grow pt-1">
                <p className={`text-sm ${readIds.includes(n.id) ? 'text-slate-500 dark:text-slate-500' : 'text-slate-900 dark:text-white font-black italic'}`}>
                  {n.message}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest flex items-center gap-1.5">
                    <Clock size={12} /> {new Date(n.date).toLocaleDateString('fr-FR')}
                  </p>
                  {n.amountLi > 0 && <span className="text-[10px] font-black text-amber-600">+{n.amountLi} Li</span>}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
