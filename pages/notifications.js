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

    // --- CONFIGURATION PUSHER (TEMPS RÉEL) ---
    const pusher = new Pusher('1da55287e2911ceb01dd', { cluster: 'us2' });
    const channel = pusher.subscribe('global-notifications');
    
    channel.bind('new-alert', (newNotif) => {
      // Vérifier si la notification est pour tout le monde ou spécifiquement pour l'utilisateur
      const isForMe = newNotif.targetEmail === "all" || 
                     (userData && newNotif.targetEmail?.toLowerCase() === userData.email.toLowerCase());
      
      if (isForMe) {
        setNotifications(prev => [newNotif, ...prev]);
        toast.info("Nouvelle activité", { 
          description: newNotif.message,
          icon: <Bell className="text-teal-500" size={16} /> 
        });
      }
    });

    return () => {
      pusher.unsubscribe('global-notifications');
    };
  }, []);

  const fetchNotifications = async (userEmail) => {
    try {
      const res = await fetch(`https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/notifications.json?t=${Date.now()}`);
      if (!res.ok) {
        setNotifications([]);
        return;
      }
      const allNotifs = await res.json();
      
      const myNotifs = allNotifs.filter(n => 
        n.targetEmail === "all" || 
        (n.targetEmail && n.targetEmail.toLowerCase() === userEmail.toLowerCase())
      );
      
      const sortedNotifs = myNotifs.sort((a, b) => new Date(b.date) - new Date(a.date));
      setNotifications(sortedNotifs);
    } catch (error) {
      console.error("Erreur notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (id) => {
    if (!readIds.includes(id)) {
      const updatedReadIds = [...readIds, id];
      setReadIds(updatedReadIds);
      localStorage.setItem("read_notifications", JSON.stringify(updatedReadIds));
    }
  };

  const getIcon = (type, isRead) => {
    const colorClass = isRead ? "text-slate-300" : "";
    switch (type) {
      case 'live': return <Radio size={20} className={`${colorClass || "text-rose-500"} animate-pulse`} />;
      case 'like': return <Heart size={20} className={`${colorClass || "text-rose-500 fill-rose-500"}`} />;
      case 'comment': return <MessageSquare size={20} className={`${colorClass || "text-teal-500 fill-teal-500"}`} />;
      case 'subscribe': return <UserPlus size={20} className={`${colorClass || "text-amber-500"}`} />;
      case 'new_text': 
      case 'global': return <BookOpen size={20} className={`${colorClass || "text-indigo-500"}`} />;
      default: return <Sparkles size={20} className={`${colorClass || "text-teal-400"}`} />;
    }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center py-40 text-teal-600 font-black uppercase text-[10px] tracking-[0.3em]">
      <Loader2 className="animate-spin mb-4" size={32} />
      Analyse du courrier...
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-10 pb-20 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex items-center justify-between pt-8">
        <button onClick={() => router.back()} className="p-4 bg-white text-slate-400 hover:text-teal-600 rounded-2xl border border-slate-100 shadow-sm transition-all active:scale-90">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic leading-none">Activités</h1>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mt-1">Le Parchemin des Nouvelles</p>
        </div>
        <button 
          onClick={() => {
            const allIds = notifications.map(n => n.id);
            setReadIds(allIds);
            localStorage.setItem("read_notifications", JSON.stringify(allIds));
            toast.success("Tout est marqué comme lu");
          }}
          className="p-3 text-slate-300 hover:text-teal-500 transition-colors"
        >
          <CheckCircle2 size={24} />
        </button>
      </header>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[3rem]">
            <Bell size={40} className="mx-auto text-slate-100 mb-4" />
            <p className="text-slate-300 font-black uppercase text-[10px] tracking-widest">Aucun message</p>
          </div>
        ) : (
          notifications.map((n) => {
            const isRead = readIds.includes(n.id);

            return (
              <Link 
                href={n.link || "#"} 
                key={n.id} 
                onClick={() => markAsRead(n.id)}
                className={`block group transition-all duration-300 ${isRead ? 'opacity-60' : 'opacity-100'}`}
              >
                <div className={`p-6 rounded-[2.5rem] transition-all duration-500 flex items-center gap-6 border
                  ${isRead ? 'bg-slate-50 border-transparent' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50 hover:border-teal-200'}`}>
                  
                  <div className={`shrink-0 p-4 rounded-2xl transition-all ${isRead ? 'bg-slate-100' : 'bg-white border border-slate-50 shadow-sm group-hover:scale-110'}`}>
                    {getIcon(n.type, isRead)}
                  </div>

                  <div className="flex-grow space-y-1">
                    <p className={`text-sm leading-relaxed font-bold transition-colors ${isRead ? 'text-slate-400' : 'text-slate-700 group-hover:text-teal-600'}`}>
                      {n.message}
                    </p>
                    
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
                      <Clock size={10} className="text-teal-500" />
                      <span>{new Date(n.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {!isRead && <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(20,184,166,0.5)]" />}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
