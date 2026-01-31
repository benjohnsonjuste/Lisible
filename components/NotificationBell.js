"use client";
import { useEffect, useState, useRef } from "react";
import Pusher from "pusher-js";
import { Bell, Coins, Zap, MessageSquare, Sparkles, X, Check } from "lucide-react";

export default function NotificationBell({ userEmail }) {
  const [notifs, setNotifs] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!userEmail) return;

    const pusher = new Pusher("1da55287e2911ceb01dd", { cluster: "us2" });
    const channel = pusher.subscribe("global-notifications");

    channel.bind("new-alert", (data) => {
      // Filtrage strict : pour tous ou pour moi
      if (data.targetEmail === "all" || data.targetEmail?.toLowerCase() === userEmail?.toLowerCase()) {
        setNotifs((prev) => [{ ...data, id: Date.now() }, ...prev]);
        // NOTE: Pas de toast ici, car la Navbar s'en occupe déjà !
      }
    });

    // Fermeture du menu au clic extérieur
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      pusher.unsubscribe("global-notifications");
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userEmail]);

  const getIcon = (type) => {
    switch (type) {
      case 'li_received': return <Coins size={14} className="text-amber-500" />;
      case 'certified_read': return <Zap size={14} className="text-teal-500" />;
      case 'comment': return <MessageSquare size={14} className="text-blue-500" />;
      default: return <Sparkles size={14} className="text-slate-400" />;
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Icône de la Cloche */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 hover:bg-slate-100 rounded-2xl transition-all active:scale-90"
      >
        <Bell size={22} className={notifs.length > 0 ? "text-teal-600" : "text-slate-600"} />
        {notifs.length > 0 && (
          <span className="absolute top-2 right-2 w-5 h-5 bg-rose-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white animate-in zoom-in">
            {notifs.length}
          </span>
        )}
      </button>

      {/* Menu des notifications rapides */}
      {isOpen && (
        <div className="absolute right-0 mt-4 w-72 bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden z-[100] animate-in slide-in-from-top-2">
          <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Flux d'activité</h4>
            {notifs.length > 0 && (
              <button onClick={() => setNotifs([])} className="text-[9px] font-black text-rose-500 uppercase">Effacer</button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="p-10 text-center">
                <Check className="mx-auto text-slate-200 mb-2" size={24} />
                <p className="text-[10px] font-bold text-slate-400 uppercase">Aucun nouveau signal</p>
              </div>
            ) : (
              notifs.map((n) => (
                <div key={n.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 flex gap-3 items-start transition-colors">
                  <div className="mt-1">{getIcon(n.type)}</div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-900 leading-tight">{n.message}</p>
                    {n.amountLi && <p className="text-[9px] text-teal-600 font-black">+{n.amountLi} Li</p>}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <a href="/notifications" className="block p-4 text-center text-[10px] font-black uppercase tracking-tighter text-slate-400 hover:bg-slate-900 hover:text-white transition-all">
            Voir tout l'historique
          </a>
        </div>
      )}
    </div>
  );
}
