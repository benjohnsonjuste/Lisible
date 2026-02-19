"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Bell, Heart, MessageSquare, Clock, 
  ArrowLeft, Sparkles, Loader2, 
  RefreshCw, Coins, Award, UserPlus, BookOpen, UserCircle
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

  // --- LOGIQUE DE SYNCHRONISATION ÉTENDUE ---
  const fetchNotifications = useCallback(async (userEmail, silent = false) => {
    if (!userEmail) return;
    if (!silent) setLoading(true);
    else setIsSyncing(true);

    try {
      // 1. Récupérer les notifs directes de l'utilisateur (Likes, Certifs, Gains, Abonnements reçus)
      const res = await fetch(`/api/github-db?type=user&id=${userEmail.toLowerCase().trim()}`);
      
      if (res.ok) {
        const data = await res.json();
        const userData = data.content;
        const myDirectNotifs = userData?.notifications || [];
        const following = userData?.following || [];

        // 2. Récupérer l'index des publications pour les notifs de suivi (Nouveaux textes)
        const indexRes = await fetch(`/api/github-db?type=publications`);
        let followNotifs = [];

        if (indexRes.ok) {
          const indexData = await indexRes.json();
          const allTexts = indexData.content || [];
          
          // On filtre les textes publiés par les gens qu'on suit (depuis moins de 7 jours pour ne pas spammer)
          const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
          
          followNotifs = allTexts
            .filter(txt => following.includes(txt.authorEmail.toLowerCase()) && new Date(txt.date).getTime() > sevenDaysAgo)
            .map(txt => ({
              id: `follow_pub_${txt.id}`,
              type: 'publication',
              message: `${txt.author} a publié un nouveau texte : "${txt.title}"`,
              date: txt.date,
              link: `/texts/${txt.id}`
            }));
        }

        // Fusion et tri par date
        const allCombined = [...myDirectNotifs, ...followNotifs];
        const sorted = allCombined.sort((a, b) => new Date(b.date) - new Date(a.date));
        
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

      // Pusher pour le temps réel
      const pusher = new Pusher('1da55287e2911ceb01dd', { cluster: 'us2' });
      const userKey = btoa(userData.email.toLowerCase().trim()).replace(/=/g, "");
      const channel = pusher.subscribe(`user-${userKey}`);
      
      channel.bind('new-alert', (newNotif) => {
        setNotifications(prev => [newNotif, ...prev]);
        toast("Nouveau signal", { description: newNotif.message });
      });

      interval = setInterval(() => fetchNotifications(userData.email, true), 45000);
      return () => {
        clearInterval(interval);
        pusher.unsubscribe(`user-${userKey}`);
      };
    } else {
      router.push("/login");
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
    const cls = isRead ? "opacity-30" : "";
    switch (type) {
      case 'gain': return <Coins size={20} className={`${cls} text-amber-500`} />;
      case 'certification': return <Award size={20} className={`${cls} text-teal-500`} />;
      case 'like': return <Heart size={20} className={`${cls} text-rose-500 fill-rose-500`} />;
      case 'follow': return <UserPlus size={20} className={`${cls} text-indigo-500`} />;
      case 'publication': return <BookOpen size={20} className={`${cls} text-emerald-500`} />;
      case 'profile_update': return <UserCircle size={20} className={`${cls} text-orange-500`} />;
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
        <button onClick={() => router.back()} className="p-4 bg-white dark:bg-slate-900 rounded-[1.2rem] border border-slate-100 dark:border-white/5 shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
            <h1 className="text-2xl font-black italic tracking-tighter">Signaux</h1>
            {isSyncing && <RefreshCw size={10} className="animate-spin text-teal-500 mx-auto mt-1" />}
        </div>
        <div className="w-12 h-12 flex items-center justify-center bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-full">
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
              href={n.link || "#"} 
              key={n.id} 
              onClick={() => markAsRead(n.id)} 
              className={`flex items-start gap-5 p-6 rounded-[2.5rem] border transition-all duration-500 ${
                readIds.includes(n.id) 
                  ? 'bg-slate-50/50 dark:bg-slate-900/20 border-transparent opacity-60' 
                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-xl shadow-slate-200/50'
              }`}
            >
              <div className="shrink-0 p-4 rounded-2xl bg-slate-50 dark:bg-white/5">
                {getIcon(n.type, readIds.includes(n.id))}
              </div>
              
              <div className="flex-grow pt-1">
                <p className={`text-[14px] leading-relaxed ${readIds.includes(n.id) ? 'text-slate-500' : 'text-slate-900 dark:text-white font-bold'}`}>
                  {n.message}
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
