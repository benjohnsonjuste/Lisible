"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Heart, MessageSquare, BookOpen, Clock, ArrowLeft, Sparkles, UserPlus } from "lucide-react";
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

      // Filtrage : Public (null) ou Personnel
      const myNotifs = allNotifs.filter(n => 
        n.targetEmail === null || 
        (n.targetEmail && n.targetEmail.toLowerCase() === userEmail.toLowerCase())
      );

      setNotifications(myNotifs);
      
      // Mise à jour pour éteindre la cloche
      if (myNotifs.length > 0) {
        localStorage.setItem("last_notif_id", myNotifs[0].id.toString());
      }
    } catch (error) {
      console.error("Erreur notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type) => {
    switch (type) {
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
      <p className="text-[10px] font-black uppercase tracking-widest">Mise à jour du flux...</p>
    </div>
  );

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-20 p-12 bg-white rounded-[3rem] text-center shadow-2xl shadow-slate-100 border border-slate-50 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
          <Bell size={40} className="animate-bounce" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-4 italic tracking-tighter">Restez connecté.</h1>
        <p className="text-slate-500 mb-10 font-medium leading-relaxed">
          Connectez-vous pour suivre vos interactions, vos nouveaux abonnés et les publications du label.
        </p>
        <Link href="/login" className="btn-lisible w-full py-5 text-xs">
          SE CONNECTER
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <header className="flex items-center justify-between">
        <button 
          onClick={() => router.back()} 
          className="p-4 bg-white text-slate-400 hover:text-teal-600 rounded-2xl border border-slate-100 shadow-sm transition-all active:scale-90"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="text-center">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic">Activités</h1>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Votre flux Lisible</p>
        </div>
        <div className="w-14"></div> {/* Équilibre visuel */}
      </header>

      {notifications.length === 0 ? (
        <div className="text-center py-24 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <div className="mb-4 flex justify-center text-slate-200">
             <Bell size={48} />
          </div>
          <p className="text-slate-400 font-bold italic tracking-wide">Aucune nouvelle notification.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((n) => (
            <Link href={n.link || "#"} key={n.id} className="block group">
              <div className="bg-white p-6 rounded-[2rem] border-none ring-1 ring-slate-100 shadow-sm hover:ring-teal-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 flex items-center gap-6">
                
                {/* Icône de type */}
                <div className="shrink-0 p-4 bg-slate-50 rounded-2xl group-hover:bg-teal-50 transition-colors">
                  {getIcon(n.type)}
                </div>

                <div className="flex-grow space-y-2">
                  <p className="text-slate-700 text-sm leading-relaxed font-bold group-hover:text-slate-900 transition-colors">
                    {n.message}
                  </p>
                  
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    <Clock size={12} className="text-teal-500" />
                    <span>
                      {new Date(n.date).toLocaleString('fr-FR', { 
                          day: 'numeric', 
                          month: 'short', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>

                <div className="p-2 text-slate-200 group-hover:text-teal-500 transition-colors">
                   <ArrowLeft size={16} className="rotate-180" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <footer className="pt-10 text-center">
         <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
            Lisible par La Belle Littéraire
         </p>
      </footer>
    </div>
  );
}
