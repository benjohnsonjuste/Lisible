"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Bell, Heart, MessageSquare, BookOpen, Clock, 
  ArrowLeft, Sparkles, UserPlus, Radio, Loader2, 
  RefreshCw, Coins, Zap 
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

      interval = setInterval(() => {
        fetchNotifications(userData.email, true);
      }, 20000);

      const pusher = new Pusher('1da55287e2911ceb01dd', { cluster: 'us2' });
      const channel = pusher.subscribe('global-notifications');
      
      channel.bind('new-alert', (newNotif) => {
        if (newNotif.targetEmail === "all" || newNotif.targetEmail?.toLowerCase() === userData.email?.toLowerCase()) {
          setNotifications(prev => {
            if (prev.find(n => n.id === newNotif.id)) return prev;
            const updated = [newNotif, ...prev];
            notifsRef.current = updated;
            return updated;
          });
          toast("Nouvelle activité", { description: newNotif.message });
        }
      });

      return () => {
        if (interval) clearInterval(interval);
        pusher.unsubscribe('global-notifications');
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

  // MISE À JOUR DES ICÔNES POUR L'ÉCONOMIE DU LI
  const getIcon = (type, isRead) => {
    const cls = isRead ? "text-slate-300" : "";
    switch (type) {
      case 'li_received': return <Coins size={20} className={`${cls || "text-amber-500 animate-pulse"}`} />;
      case 'certified_read': return <Zap size={20} className={`${cls || "text-amber-400"}`} />;
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
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Capture des signaux...</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 min-h-screen animate-in fade-in duration-700">
      <header className="flex items-center justify-between mb-10">
        <button onClick={() => router.back()} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:bg-slate-50 transition-all active:scale-95">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
            <h1 className="text-2xl font-black italic tracking-tight text-slate-900">Activités</h1>
            {isSyncing && (
                <div className="flex items-center justify-center gap-1 mt-1 text-amber-500 animate-pulse">
                    <RefreshCw size={10} className="animate-spin" />
                    <span className="text-[8px] font-black uppercase tracking-tighter">Synchronisation Li...</span>
                </div>
            )}
        </div>
        <div className="relative">
          <div className="w-12 h-12 flex items-center justify-center bg-slate-900 rounded-full text-white shadow-xl">
             <Bell size={18} />
          </div>
          {notifications.some(n => !readIds.includes(n.id)) && (
             <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 border-2 border-white rounded-full" />
          )}
        </div>
      </header>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-300 gap-4">
            <Sparkles size={40} className="opacity-20" />
            <p className="font-black uppercase text-[10px] tracking-[0.4em]">Aucune onde détectée</p>
          </div>
        ) : (
          notifications.map((n) => {
            const isRead = readIds.includes(n.id);
            const isFinancial = n.type === 'li_received' || n.type === 'certified_read';

            return (
              <Link 
                href={n.link || "/dashboard"} 
                key={n.id} 
                onClick={() => markAsRead(n.id)} 
                className={`flex items-start gap-5 p-6 rounded-[2.5rem] border transition-all duration-300 group ${
                  isRead 
                  ? 'bg-slate-50/50 border-transparent opacity-60 grayscale' 
                  : isFinancial 
                  ? 'bg-gradient-to-br from-white to-amber-50/30 border-amber-100 shadow-xl shadow-amber-500/5' 
                  : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50'
                }`}
              >
                <div className={`p-4 rounded-2xl shrink-0 transition-transform group-hover:scale-110 ${
                  isRead ? 'bg-slate-100' : isFinancial ? 'bg-amber-100 shadow-inner' : 'bg-slate-50'
                }`}>
                  {getIcon(n.type, isRead)}
                </div>
                <div className="flex-grow pt-1">
                  <div className="flex justify-between items-start gap-2">
                    <p className={`text-sm leading-relaxed ${isRead ? 'text-slate-500 font-medium' : 'text-slate-900 font-black italic'}`}>
                      {n.message}
                    </p>
                    {!isRead && (
                      <div className="mt-1 w-2.5 h-2.5 bg-teal-500 rounded-full shadow-lg shadow-teal-500/40 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-1.5">
                      <Clock size={12} className="text-slate-300" /> {new Date(n.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
      
      <footer className="mt-20 text-center py-10">
          <p className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-200">
            Lisible.biz • Le futur est écrit ici
          </p>
      </footer>
    </div>
  );
}
