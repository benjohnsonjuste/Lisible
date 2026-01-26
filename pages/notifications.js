"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Bell, Heart, MessageSquare, BookOpen, 
  Clock, ArrowLeft, Sparkles, UserPlus, Radio, CheckCircle2 
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner"; // Assurez-vous d'avoir importé toast

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
    
    if (loggedUser) {
      const userData = JSON.parse(loggedUser);
      setUser(userData);
      fetchNotifications(userData.email);
    } else {
      setLoading(false);
    }
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
        n.targetEmail === null || 
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

  // --- FONCTION DE FORMATAGE DE LIEN ---
  const formatLink = (notif) => {
    if (!notif.link) return "#";
    
    // Si c'est un nouveau texte, on s'assure que ça pointe vers /texts/[id]
    if (notif.type === "new_text") {
        // Extrait l'ID si le lien est complet (ex: /texte/123 -> 123)
        const textId = notif.link.split('/').pop();
        return `/texts/${textId}`;
    }

    // Pour les autres types, on applique le remplacement standard
    return notif.link.replace('/texte/', '/texts/');
  };

  const getIcon = (type, isRead) => {
    const colorClass = isRead ? "text-slate-300" : "";
    switch (type) {
      case 'live': return <Radio size={20} className={`${colorClass || "text-red-500"} animate-pulse`} />;
      case 'like': return <Heart size={20} className={`${colorClass || "text-rose-500 fill-rose-500"}`} />;
      case 'comment': return <MessageSquare size={20} className={`${colorClass || "text-teal-500 fill-teal-500"}`} />;
      case 'subscribe': return <UserPlus size={20} className={`${colorClass || "text-amber-500"}`} />;
      case 'new_text': return <BookOpen size={20} className={`${colorClass || "text-slate-900"}`} />;
      default: return <Sparkles size={20} className={`${colorClass || "text-teal-400"}`} />;
    }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center py-40 text-teal-600">
      <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-current mb-4"></div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Synchronisation...</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-10 pb-20 px-4 animate-in fade-in duration-700">
      <header className="flex items-center justify-between pt-8">
        <button onClick={() => router.back()} className="p-4 bg-white text-slate-400 hover:text-teal-600 rounded-2xl border border-slate-100 shadow-sm transition-all active:scale-90">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic">Activités</h1>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Boîte aux lettres</p>
        </div>
        <button 
          onClick={() => {
            const allIds = notifications.map(n => n.id);
            setReadIds(allIds);
            localStorage.setItem("read_notifications", JSON.stringify(allIds));
            toast.success("Toutes les notifications sont lues");
          }}
          className="p-3 text-slate-300 hover:text-teal-500 transition-colors"
        >
          <CheckCircle2 size={20} />
        </button>
      </header>

      <div className="space-y-3">
        {notifications.map((n) => {
          const isRead = readIds.includes(n.id);
          const finalLink = formatLink(n);

          return (
            <Link 
              href={finalLink} 
              key={n.id} 
              onClick={() => markAsRead(n.id)}
              className={`block group transition-all ${isRead ? 'opacity-60' : 'opacity-100'}`}
            >
              <div className={`p-6 rounded-[2rem] border-none ring-1 transition-all duration-300 flex items-center gap-6 
                ${n.type === 'live' && !isRead 
                  ? 'bg-slate-900 ring-slate-800 shadow-xl shadow-red-900/10' 
                  : isRead ? 'bg-slate-50 ring-transparent' : 'bg-white ring-slate-100 shadow-sm hover:ring-teal-200'
                }`}>
                
                <div className={`shrink-0 p-4 rounded-2xl transition-colors 
                  ${n.type === 'live' && !isRead ? 'bg-red-500/20' : 'bg-white border border-slate-100 group-hover:bg-teal-50'}`}>
                  {getIcon(n.type, isRead)}
                </div>

                <div className="flex-grow space-y-1">
                  <p className={`text-sm leading-relaxed font-bold transition-colors 
                    ${n.type === 'live' && !isRead ? 'text-white' : isRead ? 'text-slate-400' : 'text-slate-700 group-hover:text-slate-900'}`}>
                    {n.message}
                  </p>
                  
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-300">
                    <Clock size={10} />
                    <span>{new Date(n.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
