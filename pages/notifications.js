"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Bell, Heart, MessageSquare, BookOpen, 
  Clock, ArrowLeft, Sparkles, UserPlus, Radio, CheckCircle2, Loader2 
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

  // Charger les IDs lus depuis le localStorage
  useEffect(() => {
    const savedReadIds = JSON.parse(localStorage.getItem("read_notifications") || "[]");
    setReadIds(savedReadIds);
  }, []);

  // Fonction pour récupérer les notifications (GitHub + Cache busting)
  const fetchNotifications = useCallback(async (userEmail) => {
    try {
      const res = await fetch(`https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/notifications.json?t=${Date.now()}`);
      if (!res.ok) return;
      const allNotifs = await res.json();
      
      const myNotifs = allNotifs.filter(n => 
        n.targetEmail === "all" || 
        (n.targetEmail && n.targetEmail.toLowerCase() === userEmail.toLowerCase())
      );
      
      setNotifications(myNotifs.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (error) {
      console.error("Erreur fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 1. Init User
    const loggedUser = localStorage.getItem("lisible_user");
    let userData = null;
    if (loggedUser) {
      userData = JSON.parse(loggedUser);
      setUser(userData);
      fetchNotifications(userData.email);
    } else {
      setLoading(false);
    }

    // 2. CONFIGURATION PUSHER
    const pusher = new Pusher('1da55287e2911ceb01dd', { cluster: 'us2' });
    const channel = pusher.subscribe('global-notifications');
    
    channel.bind('new-alert', (newNotif) => {
      // On récupère l'user actuel au moment de l'événement pour éviter les variables vides
      const freshUser = JSON.parse(localStorage.getItem("lisible_user") || "{}");
      
      const isForMe = newNotif.targetEmail === "all" || 
                     (freshUser.email && newNotif.targetEmail?.toLowerCase() === freshUser.email.toLowerCase());
      
      if (isForMe) {
        // On ajoute un ID si manquant pour que le "marqué comme lu" fonctionne
        const finalNotif = { 
            ...newNotif, 
            id: newNotif.id || `live-${Date.now()}`,
            date: newNotif.date || new Date().toISOString() 
        };

        setNotifications(prev => {
          if (prev.find(n => n.id === finalNotif.id)) return prev;
          return [finalNotif, ...prev];
        });

        toast("Nouvelle activité", {
          description: finalNotif.message,
          icon: <Sparkles className="text-teal-500" size={16} />
        });
      }
    });

    return () => {
      pusher.unsubscribe('global-notifications');
      channel.unbind_all();
    };
  }, [fetchNotifications]);

  const markAsRead = (id) => {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      setReadIds(updated);
      localStorage.setItem("read_notifications", JSON.stringify(updated));
    }
  };

  const getIcon = (type, isRead) => {
    const cls = isRead ? "text-slate-300" : "";
    switch (type) {
      case 'live': return <Radio size={20} className={`${cls || "text-rose-500 animate-pulse"}`} />;
      case 'new_text': return <BookOpen size={20} className={`${cls || "text-indigo-500"}`} />;
      case 'like': return <Heart size={20} className={`${cls || "text-rose-500 fill-rose-500"}`} />;
      default: return <Bell size={20} className={`${cls || "text-teal-500"}`} />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="animate-spin text-teal-600" size={40} />
        <p className="text-slate-400 font-medium">Chargement de vos activités...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 min-h-screen">
      <header className="flex items-center justify-between mb-8">
        <button 
          onClick={() => router.back()} 
          className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-black italic tracking-tight">Activités</h1>
        <div className="w-10" />
      </header>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
               <Bell size={32} className="text-slate-200" />
            </div>
            <p className="text-slate-400 font-medium">Aucune activité pour le moment.</p>
          </div>
        ) : (
          notifications.map((n) => {
            const isRead = readIds.includes(n.id);
            // On s'assure que n.link existe, sinon on pointe vers le club par défaut
            const linkHref = n.link || "/lisible-club";

            return (
              <Link 
                href={linkHref} 
                key={n.id} 
                onClick={() => markAsRead(n.id)}
                className={`flex items-center gap-4 p-5 rounded-[2.5rem] border transition-all active:scale-[0.98] ${
                  isRead 
                  ? 'bg-slate-50/50 border-transparent opacity-60' 
                  : 'bg-white border-slate-100 shadow-xl shadow-slate-200/40'
                }`}
              >
                <div className={`p-4 rounded-2xl ${isRead ? 'bg-slate-100' : 'bg-slate-50'}`}>
                    {getIcon(n.type, isRead)}
                </div>
                
                <div className="flex-grow">
                  <p className={`text-sm leading-snug ${isRead ? 'text-slate-500 font-medium' : 'text-slate-900 font-bold'}`}>
                    {n.message}
                  </p>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-2 flex items-center gap-2">
                    <Clock size={10} />
                    {n.date ? new Date(n.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : "Maintenant"}
                  </p>
                </div>

                {!isRead && (
                  <div className="flex flex-col items-center gap-1">
                     <div className="w-2.5 h-2.5 bg-teal-500 rounded-full shadow-lg shadow-teal-500/50" />
                  </div>
                )}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
