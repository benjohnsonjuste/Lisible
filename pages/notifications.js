"use client";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    const loggedUser = localStorage.getItem("lisible_user");
    const savedReadIds = JSON.parse(localStorage.getItem("read_notifications") || "[]");
    setReadIds(savedReadIds);
    
    let userData = null;
    if (loggedUser) {
      userData = JSON.parse(loggedUser);
      setUser(userData);
      fetchNotifications(userData.email);
    } else {
      setLoading(false);
    }

    // --- CONFIGURATION PUSHER ---
    // Remplacez par votre Key Pusher
    const pusher = new Pusher('1da55287e2911ceb01dd', { cluster: 'us2' });
    const channel = pusher.subscribe('global-notifications');
    
    channel.bind('new-alert', (newNotif) => {
      // On vérifie si la notif nous est destinée
      const isForMe = newNotif.targetEmail === "all" || 
                     (userData && newNotif.targetEmail?.toLowerCase() === userData.email.toLowerCase());
      
      if (isForMe) {
        setNotifications(prev => [newNotif, ...prev]);
        toast("Nouvelle activité", {
          description: newNotif.message,
          icon: <Sparkles className="text-teal-500" size={16} />
        });
      }
    });

    return () => {
      pusher.unsubscribe('global-notifications');
    };
  }, []);

  const fetchNotifications = async (userEmail) => {
    try {
      // Ajout d'un timestamp pour éviter le cache navigateur
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
  };

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

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-teal-600" /></div>;

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <header className="flex items-center justify-between mb-8">
        <button onClick={() => router.back()} className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-black italic">Activités</h1>
        <div className="w-10" />
      </header>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <p className="text-center text-slate-400 py-20 font-medium">Aucune notification pour le moment.</p>
        ) : (
          notifications.map((n) => {
            const isRead = readIds.includes(n.id);
            return (
              <Link 
                href={n.link} 
                key={n.id} 
                onClick={() => markAsRead(n.id)}
                className={`flex items-center gap-4 p-5 rounded-[2rem] border transition-all ${isRead ? 'bg-slate-50 border-transparent opacity-60' : 'bg-white border-slate-100 shadow-lg shadow-slate-200/40'}`}
              >
                <div className="p-3 bg-slate-50 rounded-xl">{getIcon(n.type, isRead)}</div>
                <div className="flex-grow">
                  <p className={`text-sm ${isRead ? 'text-slate-500' : 'text-slate-900 font-bold'}`}>{n.message}</p>
                  <p className="text-[10px] text-slate-400 uppercase mt-1">{new Date(n.date).toLocaleDateString()}</p>
                </div>
                {!isRead && <div className="w-2 h-2 bg-teal-500 rounded-full" />}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
