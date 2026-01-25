"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Bell, Heart, MessageSquare, BookOpen, 
  Clock, ArrowLeft, Sparkles, UserPlus, Radio 
} from "lucide-react";
import Link from "next/link";

export default function NotificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loggedUser = localStorage.getItem("lisible_user");
    
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

      // Filtrage : Public (targetEmail === null) ou Personnel
      const myNotifs = allNotifs.filter(n => 
        n.targetEmail === null || 
        (n.targetEmail && n.targetEmail.toLowerCase() === userEmail.toLowerCase())
      );

      // Trier par date la plus récente
      const sortedNotifs = myNotifs.sort((a, b) => new Date(b.date) - new Date(a.date));

      setNotifications(sortedNotifs);
      
      // Mise à jour de l'état de lecture local pour la cloche
      if (sortedNotifs.length > 0) {
        localStorage.setItem("last_notif_id", sortedNotifs[0].id.toString());
      }
    } catch (error) {
      console.error("Erreur notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'live': return <Radio size={20} className="text-red-500 animate-pulse" />; // Icône pour le Club
      case 'like': return <Heart size={20} className="text-rose-500 fill-rose-500" />;
      case 'comment': return <MessageSquare size={20} className="text-teal-500 fill-teal-500" />;
      case 'subscribe': return <UserPlus size={20} className="text-amber-500" />;
      case 'new_text': return <BookOpen size={20} className="text-slate-900" />;
      default: return <Sparkles size={20} className="text-teal-400" />;
    }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center py-40 text-teal-600">
      <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-current mb-4"></div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Synchronisation...</p>
    </div>
  );

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-20 p-12 bg-white rounded-[3rem] text-center shadow-2xl shadow-slate-100 border border-slate-50 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
          <Bell size={40} className="animate-bounce" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-4 italic tracking-tighter">Votre boîte aux lettres.</h1>
        <p className="text-slate-500 mb-10 font-medium leading-relaxed">
          Connectez-vous pour voir qui a aimé vos textes et rejoindre les directs du Club.
        </p>
        <Link href="/login" className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black uppercase text-[10px] block tracking-widest">
          SE CONNECTER
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-10 pb-20 px-4 animate-in fade-in duration-700">
      {/* Header */}
      <header className="flex items-center justify-between pt-8">
        <button 
          onClick={() => router.back()} 
          className="p-4 bg-white text-slate-400 hover:text-teal-600 rounded-2xl border border-slate-100 shadow-sm transition-all active:scale-90"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic">Activités</h1>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Mises à jour Lisible</p>
        </div>
        <div className="w-12"></div>
      </header>

      {notifications.length === 0 ? (
        <div className="text-center py-24 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <div className="mb-4 flex justify-center text-slate-200">
             <Bell size={48} />
          </div>
          <p className="text-slate-400 font-bold italic tracking-wide">Tout est calme ici.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Link href={n.link || "#"} key={n.id} className="block group">
              <div className={`p-6 rounded-[2rem] border-none ring-1 transition-all duration-300 flex items-center gap-6 
                ${n.type === 'live' 
                  ? 'bg-slate-900 ring-slate-800 shadow-xl shadow-red-900/10' 
                  : 'bg-white ring-slate-100 shadow-sm hover:ring-teal-200'
                }`}>
                
                {/* Icône */}
                <div className={`shrink-0 p-4 rounded-2xl transition-colors 
                  ${n.type === 'live' ? 'bg-red-500/20' : 'bg-slate-50 group-hover:bg-teal-50'}`}>
                  {getIcon(n.type)}
                </div>

                <div className="flex-grow space-y-1">
                  <p className={`text-sm leading-relaxed font-bold transition-colors 
                    ${n.type === 'live' ? 'text-white' : 'text-slate-700 group-hover:text-slate-900'}`}>
                    {n.message}
                  </p>
                  
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    <Clock size={10} className={n.type === 'live' ? 'text-red-400' : 'text-teal-500'} />
                    <span>
                      {new Date(n.date).toLocaleString('fr-FR', { 
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>

                {n.type === 'live' && (
                  <div className="px-3 py-1 bg-red-600 rounded-full text-[8px] font-black text-white animate-pulse uppercase tracking-tighter">
                    Direct
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
