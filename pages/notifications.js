"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, Heart, MessageSquare, BookOpen, Clock, ArrowLeft, Sparkles, UserPlus, Radio, Loader2 } from "lucide-react";
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
    const savedReadIds = JSON.parse(localStorage.getItem("read_notifications") || "[]");
    setReadIds(savedReadIds);
  }, []);

  const fetchNotifications = useCallback(async (userEmail) => {
    try {
      const res = await fetch(`https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/notifications.json?t=${Date.now()}`);
      if (!res.ok) return;
      const allNotifs = await res.json();
      
      // Filtrage : "all" pour les nouveaux textes, ou email spécifique pour Likes/Commentaires/Follows
      const myNotifs = allNotifs.filter(n => 
        n.targetEmail === "all" || 
        n.targetEmail?.toLowerCase() === userEmail.toLowerCase()
      );
      setNotifications(myNotifs.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const loggedUser = localStorage.getItem("lisible_user");
    if (loggedUser) {
      const userData = JSON.parse(loggedUser);
      setUser(userData);
      fetchNotifications(userData.email);
    } else { setLoading(false); }

    const pusher = new Pusher('1da55287e2911ceb01dd', { cluster: 'us2' });
    const channel = pusher.subscribe('global-notifications');
    channel.bind('new-alert', (newNotif) => {
      const freshUser = JSON.parse(localStorage.getItem("lisible_user") || "{}");
      if (newNotif.targetEmail === "all" || newNotif.targetEmail?.toLowerCase() === freshUser.email?.toLowerCase()) {
        setNotifications(prev => [newNotif, ...prev]);
        toast("Nouvelle activité", { description: newNotif.message });
      }
    });
    return () => pusher.unsubscribe('global-notifications');
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
      case 'subscription': return <UserPlus size={20} className={`${cls || "text-teal-500"}`} />;
      case 'like': return <Heart size={20} className={`${cls || "text-rose-500 fill-rose-500"}`} />;
      case 'comment': return <MessageSquare size={20} className={`${cls || "text-blue-500"}`} />;
      case 'new_text': return <BookOpen size={20} className={`${cls || "text-teal-600"}`} />;
      case 'live': return <Radio size={20} className={`${cls || "text-rose-500 animate-pulse"}`} />;
      default: return <Bell size={20} className={`${cls || "text-slate-400"}`} />;
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center py-40 gap-4">
      <Loader2 className="animate-spin text-teal-600" size={40} />
      <p className="text-slate-400">Synchronisation...</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 min-h-screen">
      <header className="flex items-center justify-between mb-8">
        <button onClick={() => router.back()} className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm hover:bg-slate-50"><ArrowLeft size={20} /></button>
        <h1 className="text-2xl font-black italic tracking-tight">Activités</h1>
        <div className="w-10" />
      </header>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-20 text-slate-400">Aucune activité pour le moment.</div>
        ) : (
          notifications.map((n) => {
            const isRead = readIds.includes(n.id);
            return (
              <Link href={n.link || "/dashboard"} key={n.id} onClick={() => markAsRead(n.id)} className={`flex items-center gap-4 p-5 rounded-[2.5rem] border transition-all ${isRead ? 'bg-slate-50/50 border-transparent opacity-60' : 'bg-white border-slate-100 shadow-xl'}`}>
                <div className={`p-4 rounded-2xl ${isRead ? 'bg-slate-100' : 'bg-slate-50'}`}>{getIcon(n.type, isRead)}</div>
                <div className="flex-grow">
                  <p className={`text-sm leading-snug ${isRead ? 'text-slate-500' : 'text-slate-900 font-bold'}`}>{n.message}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-2 flex items-center gap-2"><Clock size={10} /> {new Date(n.date).toLocaleDateString()}</p>
                </div>
                {!isRead && <div className="w-2.5 h-2.5 bg-teal-500 rounded-full shadow-lg" />}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
