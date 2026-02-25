"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Bell, Heart, MessageSquare, Clock, 
  ArrowLeft, Sparkles, Loader2, 
  RefreshCw, Coins, Award, UserPlus, BookOpen, UserCircle, Trophy
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import Pusher from "pusher-js";

export default function NotificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const notifsRef = useRef([]);

  // --- SYNCHRONISATION AVEC GITHUB-DB ---
  const fetchNotifications = useCallback(async (userEmail, silent = false) => {
    if (!userEmail) return;
    if (!silent) setLoading(true);
    else setIsSyncing(true);

    try {
      // Récupération du profil utilisateur complet
      const res = await fetch(`/api/github-db?type=user&id=${userEmail.toLowerCase().trim()}`);
      
      if (res.ok) {
        const data = await res.json();
        const userData = data.content;
        
        // On récupère le tableau 'notifications' du JSON
        const myNotifs = userData?.notifications || [];
        
        // Tri par date (plus récent en premier)
        const sorted = myNotifs.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        setNotifications(sorted);
        notifsRef.current = sorted;
      }
    } catch (error) { 
      console.error("Erreur de synchronisation:", error); 
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

      // Pusher pour le temps réel (Signaux immédiats)
      const pusher = new Pusher('1da55287e2911ceb01dd', { cluster: 'us2' });
      const userKey = btoa(userData.email.toLowerCase().trim()).replace(/=/g, "");
      const channel = pusher.subscribe(`user-${userKey}`);
      
      channel.bind('new-alert', (newNotif) => {
        setNotifications(prev => [newNotif, ...prev]);
        toast("Nouveau signal", { description: newNotif.message || "Activité sur votre compte" });
      });

      // Polling de secours toutes les 45s
      interval = setInterval(() => fetchNotifications(userData.email, true), 45000);
      
      return () => {
        clearInterval(interval);
        pusher.unsubscribe(`user-${userKey}`);
      };
    } else {
      router.push("/login");
    }
  }, [fetchNotifications, router]);

  const markAsRead = async (notifId) => {
    // Mise à jour optimiste de l'UI
    const updatedNotifs = notifications.map(n => 
      n.id === notifId ? { ...n, read: true } : n
    );
    setNotifications(updatedNotifs);

    try {
      // Persistance sur GitHub via l'API
      await fetch("/api/github-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "user",
          id: user.email,
          content: { 
            ...user, // Note: Idéalement récupérer le user frais avant le spread
            notifications: updatedNotifs 
          }
        })
      });
    } catch (e) {
      console.error("Erreur marquage lecture", e);
    }
  };

  const getIcon = (type, isRead) => {
    const cls = isRead ? "opacity-30" : "";
    switch (type) {
      case 'gain': return <Coins size={20} className={`${cls} text-amber-500`} />;
      case 'certification': return <Award size={20} className={`${cls} text-teal-500`} />;
      case 'like': return <Heart size={20} className={`${cls} text-rose-500 fill-rose-500`} />;
      case 'new_battle': return <Trophy size={20} className={`${cls} text-amber-600`} />;
      case 'new_publication': return <BookOpen size={20} className={`${cls} text-emerald-500`} />;
      case 'follow': return <UserPlus size={20} className={`${cls} text-indigo-500`} />;
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
        <button onClick={() => router.back()} className="p-4 bg-white dark:bg-slate-900 rounded-[1.2rem] border border-slate-100 dark:border-white/5 shadow-sm hover:text-teal-600 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
            <h1 className="text-2xl font-black italic tracking-tighter">Signaux</h1>
            {isSyncing && <RefreshCw size={10} className="animate-spin text-teal-500 mx-auto mt-1" />}
        </div>
        <div className="w-12 h-12 flex items-center justify-center bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-full shadow-lg shadow-slate-950/20">
             <Bell size={18} />
        </div>
      </header>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 text-slate-300 gap-6">
            <Sparkles size={40} className="opacity-20" />
            <p className="font-black uppercase text-[10px] tracking-[0.4em]">Silence radio</p>
          </div>
        ) : (
          notifications.map((n) => (
            <Link 
              href={n.textId ? `/texts/${n.textId}` : (n.link || "#")} 
              key={n.id} 
              onClick={() => markAsRead(n.id)} 
              className={`flex items-start gap-5 p-6 rounded-[2.5rem] border transition-all duration-500 ${
                n.read 
                  ? 'bg-slate-50/50 dark:bg-slate-900/20 border-transparent opacity-60' 
                  : 'bg-white dark:bg-slate-900 border-teal-100 dark:border-teal-900/30 shadow-xl shadow-teal-900/5'
              }`}
            >
              <div className="shrink-0 p-4 rounded-2xl bg-slate-50 dark:bg-white/5">
                {getIcon(n.type, n.read)}
              </div>
              
              <div className="flex-grow pt-1">
                <p className={`text-[14px] leading-relaxed ${n.read ? 'text-slate-500' : 'text-slate-900 dark:text-white font-bold'}`}>
                  {n.message || `${n.authorName} a publié "${n.textTitle}"`}
                </p>
                
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock size={12} />
                    <span className="text-[9px] font-black uppercase tracking-widest">
                      {new Date(n.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {n.amountLi > 0 && (
                    <div className="px-3 py-1 bg-amber-50 rounded-full flex items-center gap-1 border border-amber-100">
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
    </div>
  );
}
