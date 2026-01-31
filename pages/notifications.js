"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Bell, Heart, MessageSquare, BookOpen, Clock, 
  ArrowLeft, Sparkles, UserPlus, Radio, Loader2, 
  RefreshCw, Coins, Zap, Award, Cake, Crown, TrendingUp
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

  const fetchNotifications = useCallback(async (userEmail, silent = false) => {
    if (!silent) setLoading(true);
    else setIsSyncing(true);

    try {
      const res = await fetch(`https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/notifications.json?t=${Date.now()}`);
      if (!res.ok) return;
      const allNotifs = await res.json();
      
      // Filtre : Notifs globales + Notifs ciblées sur l'email de l'utilisateur
      const myNotifs = allNotifs.filter(n => 
        n.targetEmail === "all" || 
        n.targetEmail?.toLowerCase() === userEmail?.toLowerCase()
      );

      const sorted = myNotifs.sort((a, b) => new Date(b.date) - new Date(a.date));
      setNotifications(sorted);
      notifsRef.current = sorted;
    } catch (error) { 
      console.error("Sync error:", error); 
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

      // Rafraîchissement automatique toutes les 20 secondes
      interval = setInterval(() => {
        fetchNotifications(userData.email, true);
      }, 20000);

      // --- CONFIGURATION PUSHER (Temps Réel) ---
      const pusher = new Pusher('1da55287e2911ceb01dd', { cluster: 'us2' });
      
      // Canal Global
      const globalChannel = pusher.subscribe('global-notifications');
      
      // Canal Privé (Basé sur l'email en base64 pour correspondre à l'API)
      const userKey = btoa(userData.email.toLowerCase()).replace(/=/g, "");
      const privateChannel = pusher.subscribe(`user-${userKey}`);
      
      const handleNewNotif = (newNotif) => {
        setNotifications(prev => {
          if (prev.find(n => n.id === newNotif.id)) return prev;
          const updated = [newNotif, ...prev];
          notifsRef.current = updated;
          return updated;
        });
        
        // Sonnerie ou Toast selon l'importance
        if (newNotif.type === 'gain' || newNotif.type === 'badge') {
           toast.success("Succès !", { description: newNotif.message });
        } else {
           toast("Nouvelle activité", { description: newNotif.message });
        }
      };

      globalChannel.bind('new-alert', handleNewNotif);
      privateChannel.bind('new-alert', handleNewNotif);

      return () => {
        if (interval) clearInterval(interval);
        pusher.unsubscribe('global-notifications');
        pusher.unsubscribe(`user-${userKey}`);
      };
    } else {
      setLoading(false);
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

  // --- ATTRIBUTION DES ICÔNES PAR SYSTÈME ---
  const getIcon = (type, isRead) => {
    const cls = isRead ? "text-slate-300" : "";
    switch (type) {
      // Système Économique
      case 'gain': 
      case 'li_received': return <Coins size={20} className={`${cls || "text-amber-500 animate-bounce"}`} />;
      case 'certified_read': return <Zap size={20} className={`${cls || "text-amber-400"}`} />;
      
      // Système de Prestige
      case 'badge': return <Award size={20} className={`${cls || "text-teal-500 animate-pulse"}`} />;
      case 'pgd': return <Crown size={20} className={`${cls || "text-slate-900 shadow-sm"}`} />;
      case 'plume_semaine': return <TrendingUp size={20} className={`${cls || "text-indigo-500"}`} />;
      case 'anniversaire': return <Cake size={20} className={`${cls || "text-rose-500 animate-bounce"}`} />;
      
      // Système Social
      case 'subscription': return <UserPlus size={20} className={`${cls || "text-teal-500"}`} />;
      case 'like': return <Heart size={20} className={`${cls || "text-rose-500 fill-rose-500"}`} />;
      case 'comment': return <MessageSquare size={20} className={`${cls || "text-blue-500"}`} />;
      case 'new_text': return <BookOpen size={20} className={`${cls || "text-teal-600"}`} />;
      case 'live': return <Radio size={20} className={`${cls || "text-rose-500 animate-pulse"}`} />;
      
      default: return <Bell size={20} className={`${cls || "text-slate-400"}`} />;
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-white">
      <Loader2 className="animate-spin text-teal-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Interception des fréquences...</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 min-h-screen animate-in fade-in duration-700">
      <header className="flex items-center justify-between mb-10">
        <button onClick={() => router.back()} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:bg-slate-50 transition-all active:scale-95">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
            <h1 className="text-2xl font-black italic tracking-tight text-slate-900">Signaux</h1>
            {isSyncing && (
                <div className="flex items-center justify-center gap-1 mt-1 text-teal-500">
                    <RefreshCw size={10} className="animate-spin" />
                    <span className="text-[8px] font-black uppercase tracking-tighter">Récupération Li...</span>
                </div>
            )}
        </div>
        <div className="relative">
          <div className="w-12 h-12 flex items-center justify-center bg-slate-900 rounded-full text-white shadow-xl shadow-slate-900/20">
             <Bell size={18} />
          </div>
          {notifications.some(n => !readIds.includes(n.id)) && (
             <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 border-2 border-white rounded-full animate-ping" />
          )}
        </div>
      </header>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-300 gap-4 text-center">
            <Sparkles size={40} className="opacity-20" />
            <p className="font-black uppercase text-[10px] tracking-[0.4em]">Zone de silence radio</p>
          </div>
        ) : (
          notifications.map((n) => {
            const isRead = readIds.includes(n.id);
            const isVip = n.type === 'gain' || n.type === 'badge' || n.type === 'anniversaire';

            return (
              <Link 
                href={n.link || "/account"} 
                key={n.id} 
                onClick={() => markAsRead(n.id)} 
                className={`flex items-start gap-5 p-6 rounded-[2.5rem] border transition-all duration-300 group ${
                  isRead 
                  ? 'bg-slate-50/50 border-transparent opacity-60 grayscale' 
                  : isVip 
                  ? 'bg-gradient-to-br from-white to-teal-50/20 border-teal-100 shadow-xl shadow-teal-500/5 ring-1 ring-teal-500/10' 
                  : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50'
                }`}
              >
                <div className={`p-4 rounded-2xl shrink-0 transition-transform group-hover:scale-110 ${
                  isRead ? 'bg-slate-100' : isVip ? 'bg-teal-50 shadow-inner' : 'bg-slate-50'
                }`}>
                  {getIcon(n.type, isRead)}
                </div>
                <div className="flex-grow pt-1">
                  <div className="flex justify-between items-start gap-2">
                    <p className={`text-sm leading-relaxed ${isRead ? 'text-slate-500 font-medium' : 'text-slate-900 font-black italic'}`}>
                      {n.message}
                    </p>
                    {!isRead && (
                      <div className="mt-1 w-2 h-2 bg-teal-500 rounded-full shadow-lg shadow-teal-500/40 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-1.5">
                      <Clock size={12} className="text-slate-300" /> 
                      {new Date(n.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </p>
                    {n.amountLi > 0 && !isRead && (
                      <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg">
                        +{n.amountLi} Li
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
      
      <footer className="mt-20 text-center py-10 opacity-30">
          <p className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-400">
            LISIBLE.BIZ • SYSTÈME DE GESTION DES FLUX
          </p>
      </footer>
    </div>
  );
}
