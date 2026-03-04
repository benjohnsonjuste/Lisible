"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Bell, Heart, MessageSquare, Clock, 
  ArrowLeft, Sparkles, Loader2, 
  RefreshCw, Coins, Award, UserPlus, BookOpen, Trophy, Smartphone
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
  const [pushEnabled, setPushEnabled] = useState(false);

  // Vérification de la permission de notification au montage
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushEnabled(Notification.permission === "granted");
    }
  }, []);

  const requestPushPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Votre navigateur ne supporte pas les notifications push.");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setPushEnabled(true);
      toast.success("Notifications activées !", {
        description: "Vous recevrez désormais vos signaux en temps réel sur cet appareil."
      });
      // Ici, on pourrait enregistrer le token push en base de données si nécessaire
    } else {
      toast.error("Permission refusée.");
    }
  };

  const fetchNotifications = useCallback(async (userEmail, silent = false) => {
    if (!userEmail) return;
    if (!silent) setLoading(true);
    else setIsSyncing(true);

    try {
      const res = await fetch(`/api/github-db?type=user&id=${encodeURIComponent(userEmail.toLowerCase().trim())}`);
      
      if (res.ok) {
        const data = await res.json();
        if (data && data.content) {
          const userData = data.content;
          setUser(userData);
          localStorage.setItem("lisible_user", JSON.stringify(userData));
          
          const myNotifs = userData.notifications || [];
          const sorted = [...myNotifs].sort((a, b) => new Date(b.date) - new Date(a.date));
          
          setNotifications(sorted);
        }
      }
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
      const parsedUser = JSON.parse(loggedUser);
      fetchNotifications(parsedUser.email);

      const pusher = new Pusher('1da55287e2911ceb01dd', { cluster: 'us2' });
      const userKey = btoa(parsedUser.email.toLowerCase().trim()).replace(/=/g, "");
      const channel = pusher.subscribe(`user-${userKey}`);
      
      channel.bind('new-alert', (newNotif) => {
        fetchNotifications(parsedUser.email, true);
        toast("Nouveau signal", { description: newNotif.message || "Activité sur votre compte" });
        
        // Notification système si l'onglet est en arrière-plan et permission accordée
        if (Notification.permission === "granted" && document.visibilityState !== "visible") {
          new Notification("Lisible.biz", { body: newNotif.message, icon: "/icon.png" });
        }
      });

      interval = setInterval(() => fetchNotifications(parsedUser.email, true), 45000);
      
      return () => {
        clearInterval(interval);
        pusher.unsubscribe(`user-${userKey}`);
      };
    } else {
      router.push("/login");
    }
  }, [fetchNotifications, router]);

  const markAsRead = async (notifId) => {
    const updatedNotifs = notifications.map(n => 
      n.id === notifId ? { ...n, read: true } : n
    );
    setNotifications(updatedNotifs);

    try {
      await fetch("/api/github-db", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "user",
          id: user.email,
          action: "mark_read",
          notifId: notifId
        })
      });
    } catch (e) {
      console.error("Erreur marquage lecture", e);
    }
  };

  const getIcon = (type, isRead) => {
    const cls = isRead ? "opacity-30" : "animate-pulse";
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
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-[#FCFBF9]">
      <Loader2 className="animate-spin text-teal-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Interception des fréquences...</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-12 px-6 min-h-screen bg-[#FCFBF9]">
      <header className="flex items-center justify-between mb-12">
        <button onClick={() => router.back()} className="p-4 bg-white rounded-[1.2rem] border border-slate-100 shadow-sm hover:text-teal-600 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
            <h1 className="text-2xl font-black italic tracking-tighter text-slate-900">Signaux.</h1>
            {isSyncing && <div className="flex items-center gap-1 justify-center"><RefreshCw size={8} className="animate-spin text-teal-500" /><span className="text-[7px] font-black uppercase text-teal-500">Sync</span></div>}
        </div>
        <div className="w-12 h-12 flex items-center justify-center bg-slate-950 text-white rounded-full shadow-lg shadow-slate-950/20">
             <Bell size={18} />
        </div>
      </header>

      {/* BANNIÈRE ACTIVATION PUSH */}
      {!pushEnabled && (
        <div className="mb-8 p-6 bg-slate-900 rounded-[2.5rem] text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <Smartphone size={80} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-teal-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-teal-400">Mobilité</span>
            </div>
            <h3 className="text-lg font-bold italic mb-2">Ne manquez aucun signal.</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-6 max-w-[80%]">
              Activez les notifications push pour recevoir vos gains et vos mentions directement sur votre téléphone, même en étant hors du site.
            </p>
            <button 
              onClick={requestPushPermission}
              className="px-6 py-3 bg-white text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-500 hover:text-white transition-all"
            >
              Activer les push
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4 pb-20">
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
                  ? 'bg-slate-50/50 border-transparent opacity-60' 
                  : 'bg-white border-teal-100 shadow-xl shadow-teal-900/5 hover:border-teal-300'
              }`}
            >
              <div className="shrink-0 p-4 rounded-2xl bg-slate-50">
                {getIcon(n.type, n.read)}
              </div>
              
              <div className="flex-grow pt-1">
                <p className={`text-[14px] leading-relaxed ${n.read ? 'text-slate-500' : 'text-slate-900 font-bold'}`}>
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
