"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Pusher from "pusher-js";
import { toast } from "sonner";
import ThemeToggle from "./ThemeToggle"; 

import {
  Menu, Home, Library, LayoutDashboard, LogOut, LogIn,
  Users, MessageCircle, Calendar, X, Sparkles,
  ChevronRight, Radio, Coins, Zap, MessageSquare, Bell
} from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // 1. Hydratation initiale
    const loggedUser = localStorage.getItem("lisible_user");
    const currentUser = loggedUser ? JSON.parse(loggedUser) : null;
    setUser(currentUser);

    const savedCount = localStorage.getItem("unread_notifs");
    if (savedCount) setUnreadCount(parseInt(savedCount));

    // 2. Configuration Pusher
    const pusher = new Pusher('1da55287e2911ceb01dd', { cluster: 'us2' });
    const channel = pusher.subscribe('global-notifications');
    
    channel.bind('new-alert', (notif) => {
      const isForMe = notif.targetEmail === "all" || 
                      (currentUser && notif.targetEmail?.toLowerCase() === currentUser.email?.toLowerCase());

      if (!isForMe) return;

      setUnreadCount(prev => {
        const next = prev + 1;
        localStorage.setItem("unread_notifs", next.toString());
        return next;
      });

      // Feedback Audio "Lisible"
      const playNotifSound = () => {
        try {
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
          gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          oscillator.start();
          oscillator.stop(audioCtx.currentTime + 0.3);
        } catch (e) { /* Silencieux si bloqué par navigateur */ }
      };
      playNotifSound();
      
      const getToastIcon = () => {
        switch(notif.type) {
          case 'li_received': return <Coins size={18} className="text-amber-500 animate-bounce" />;
          case 'certified_read': return <Zap size={18} className="text-teal-400" />;
          case 'comment': return <MessageSquare size={18} className="text-blue-500" />;
          case 'live': return <Radio size={18} className="text-red-500 animate-pulse" />;
          default: return <Sparkles size={18} className="text-teal-500" />;
        }
      };

      toast(notif.message, {
        description: notif.description || "Nouvelle résonance sur Lisible",
        icon: getToastIcon(),
        action: {
          label: "VOIR",
          onClick: () => {
            setUnreadCount(0);
            localStorage.setItem("unread_notifs", "0");
            router.push(notif.link || "/notifications");
          }
        },
        duration: 6000,
        className: "rounded-[2rem] border-slate-100 dark:border-white/10 dark:bg-slate-900 dark:text-white shadow-2xl font-sans",
      });
    });

    const handleStorageChange = () => {
      const updatedUser = localStorage.getItem("lisible_user");
      setUser(updatedUser ? JSON.parse(updatedUser) : null);
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      pusher.unsubscribe('global-notifications');
    };
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("lisible_user");
    localStorage.removeItem("unread_notifs");
    setUser(null);
    setUnreadCount(0);
    setIsMenuOpen(false);
    router.push("/auth"); // Redirige vers ta nouvelle page d'auth
  };

  const menuItems = [
    { href: "/", label: "Accueil", icon: <Home size={20} /> },
    { href: "/library", label: "Bibliothèque", icon: <Library size={20} /> },
    { href: "/dashboard", label: "Studio Auteur", icon: <LayoutDashboard size={20} />, authRequired: true },
    { href: "/communaute", label: "Communauté", icon: <Users size={20} /> },
    { href: "/evenements", label: "Événements", icon: <Calendar size={20} /> },
    { href: "/contact", label: "Contact", icon: <MessageCircle size={20} /> },
  ];

  return (
    <>
      <header className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md fixed top-0 left-0 w-full z-50 h-20 border-b border-slate-100 dark:border-white/5 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-6">
          
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="p-3 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-600 rounded-2xl transition-all shadow-sm border border-slate-100 dark:border-white/10"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link href="/" className="group flex items-center gap-2">
              <span className="font-black text-2xl tracking-tighter text-slate-900 dark:text-white italic">
                Lisible<span className="text-teal-600">.</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-100/50 dark:bg-white/5 p-1.5 rounded-[1.5rem] border border-slate-100 dark:border-white/10">
              <NavLink href="/" icon={<Home size={20} />} active={pathname === "/"} title="Accueil" />
              <NavLink href="/library" icon={<Library size={20} />} active={pathname === "/bibliotheque"} title="Bibliothèque" />
              {user && <NavLink href="/dashboard" icon={<LayoutDashboard size={20} />} active={pathname === "/dashboard"} title="Studio Auteur" />}
            </nav>

            <div className="flex items-center gap-1 md:gap-2">
              <ThemeToggle />
              
              <Link 
                href="/notifications" 
                onClick={() => { setUnreadCount(0); localStorage.setItem("unread_notifs", "0"); }}
                className="p-3 text-slate-400 dark:text-slate-500 hover:text-teal-600 transition-all relative"
              >
                <Bell size={22} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 bg-teal-600 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-950 animate-bounce">
                    {unreadCount > 9 ? "!" : unreadCount}
                  </span>
                )}
              </Link>
              
              {user ? (
                <button onClick={handleLogout} className="p-3 text-slate-400 hover:text-rose-500 transition-all">
                  <LogOut size={22} />
                </button>
              ) : (
                <Link href="/login" className="ml-2 px-6 py-2.5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-teal-600 dark:hover:bg-teal-500 dark:hover:text-white transition-all shadow-lg active:scale-95">
                  Connexion
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* SIDEBAR OVERLAY */}
      <aside className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-slate-900 shadow-2xl transform transition-transform duration-500 ease-in-out z-[60] border-r border-slate-50 dark:border-white/5 ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-8 flex flex-col h-full">
          <div className="flex items-center justify-between mb-10">
            <span className="font-black italic text-xl tracking-tighter text-teal-600">Lisible.</span>
            <button onClick={() => setIsMenuOpen(false)} className="p-2 text-slate-400 hover:text-teal-600 transition-colors"><X size={24} /></button>
          </div>

          {user && (
            <Link href="/account" onClick={() => setIsMenuOpen(false)} className="mb-10 p-5 bg-slate-50 dark:bg-white/5 hover:bg-teal-50 dark:hover:bg-teal-900/10 rounded-[2rem] flex items-center justify-between gap-4 border border-slate-100 dark:border-white/5 transition-all group">
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="shrink-0 w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl overflow-hidden border-2 border-white dark:border-slate-950 shadow-lg relative">
                  {user.profilePic ? (
                    <img src={user.profilePic} className="w-full h-full object-cover" alt="Avatar" />
                  ) : (
                    <div className="w-full h-full bg-teal-600 text-white flex items-center justify-center font-black">
                      {user.name?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="text-left overflow-hidden">
                  <p className="text-sm font-black text-slate-900 dark:text-white truncate">{user.penName || user.name}</p>
                  <p className="text-[9px] uppercase font-black text-teal-600 tracking-widest">Compte Lisible</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}

          <nav className="space-y-1">
            {menuItems.map((item) => (item.authRequired && !user ? null : (
              <Link 
                key={item.href} 
                href={item.href} 
                onClick={() => setIsMenuOpen(false)} 
                className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all font-bold text-sm ${pathname === item.href ? "bg-slate-950 dark:bg-white text-white dark:text-slate-900 shadow-xl" : "text-slate-500 dark:text-slate-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-600"}`}
              >
                <span className={pathname === item.href ? "text-teal-400" : "text-slate-300 dark:text-slate-600"}>{item.icon}</span>
                <span className="flex-grow">{item.label}</span>
              </Link>
            )))}
          </nav>

          <footer className="mt-auto pt-10 text-center">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300 dark:text-slate-700">
              Écosystème Lisible
            </p>
          </footer>
        </div>
      </aside>

      {/* Backdrop */}
      {isMenuOpen && <div onClick={() => setIsMenuOpen(false)} className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-50 animate-in fade-in" />}
    </>
  );
}

function NavLink({ href, icon, active, title }) {
  return (
    <Link 
      href={href} 
      title={title} 
      className={`p-3 rounded-2xl transition-all relative group ${active ? "bg-white dark:bg-slate-800 text-teal-600 shadow-sm" : "text-slate-400 dark:text-slate-500 hover:text-teal-600 hover:bg-white/50 dark:hover:bg-slate-800"}`}
    >
      {icon}
      {active && (
        <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-teal-600 rounded-full shadow-[0_0_8px_rgba(13,148,136,0.6)]" />
      )}
    </Link>
  );
}
