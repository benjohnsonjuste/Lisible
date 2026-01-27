"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";
import Pusher from "pusher-js";
import { toast } from "sonner";

import {
  Menu, Home, Library, LayoutDashboard, LogOut, LogIn,
  Users, MessageCircle, Calendar, FileText, X, Sparkles,
  ChevronRight, Radio 
} from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);

  useEffect(() => {
    const checkUser = () => {
      const loggedUser = localStorage.getItem("lisible_user");
      setUser(loggedUser ? JSON.parse(loggedUser) : null);
    };

    // --- LOGIQUE PUSHER & SON ---
    const pusher = new Pusher('1da55287e2911ceb01dd', { cluster: 'us2' });
    const channel = pusher.subscribe('global-notifications');
    
    channel.bind('new-alert', (notif) => {
      // 1. Génération du son cristallin (Web Audio API)
      const playNotifSound = () => {
        try {
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();

          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
          oscillator.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.1); 

          gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);

          oscillator.start();
          oscillator.stop(audioCtx.currentTime + 0.4);
        } catch (e) { console.warn("Audio bloqué"); }
      };

      playNotifSound();

      // 2. Mise à jour de l'état Live
      if (notif.type === 'live') setIsLiveActive(true);
      
      // 3. Affichage du Toast
      toast(notif.message, {
        description: "Un événement en direct commence !",
        icon: <Radio size={18} className="text-red-500 animate-pulse" />,
        action: {
          label: "REJOINDRE",
          onClick: () => router.push(notif.link)
        },
        duration: 8000,
        className: "rounded-[1.5rem] border-teal-100 shadow-2xl",
      });
    });

    const checkLiveStatus = async () => {
      try {
        const res = await fetch("https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/live_status.json?t=" + Date.now());
        if (res.ok) {
          const data = await res.json();
          setIsLiveActive(data.isLive);
        }
      } catch (e) { setIsLiveActive(false); }
    };

    checkUser();
    checkLiveStatus();
    
    window.addEventListener('storage', checkUser);
    const liveTimer = setInterval(checkLiveStatus, 45000); 

    return () => {
      window.removeEventListener('storage', checkUser);
      clearInterval(liveTimer);
      pusher.unsubscribe('global-notifications');
    };
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("lisible_user");
    setUser(null);
    setIsMenuOpen(false);
    router.push("/login");
  };

  const menuItems = [
    { href: "/bibliotheque", label: "Bibliothèque", icon: <Library size={20} /> },
    { 
      href: "/lisible-club", 
      label: isLiveActive ? "Lisible Club • LIVE" : "Lisible Club", 
      icon: <Radio size={20} className={isLiveActive ? "text-red-500 animate-pulse" : ""} /> 
    },
    { href: "/dashboard", label: "Studio Auteur", icon: <LayoutDashboard size={20} />, authRequired: true },
    { href: "/communaute", label: "Communauté", icon: <Users size={20} /> },
    { href: "/evenements", label: "Événements", icon: <Calendar size={20} /> },
    { href: "/contact", label: "Contact", icon: <MessageCircle size={20} /> },
  ];

  return (
    <>
      <header className="bg-white/80 backdrop-blur-md fixed top-0 left-0 w-full z-50 h-20 border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-6">
          
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="p-3 bg-slate-50 text-slate-600 hover:bg-teal-50 hover:text-teal-600 rounded-2xl transition-all shadow-sm border border-slate-100"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link href="/" className="group flex items-center gap-2">
              <span className="font-black text-2xl tracking-tighter text-slate-900 italic">Lisible.</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <nav className="hidden md:flex items-center gap-1 bg-slate-50 p-1.5 rounded-[1.5rem] border border-slate-100">
              <NavLink href="/" icon={<Home size={20} />} active={pathname === "/"} title="Accueil" />
              <NavLink href="/bibliotheque" icon={<Library size={20} />} active={pathname === "/bibliotheque"} title="Bibliothèque" />
              <NavLink 
                href="/lisible-club" 
                icon={<Radio size={20} className={isLiveActive ? "text-red-500 animate-pulse" : ""} />} 
                active={pathname === "/lisible-club"} 
                title="Club" 
              />
              {user && <NavLink href="/dashboard" icon={<LayoutDashboard size={20} />} active={pathname === "/dashboard"} title="Studio Auteur" />}
            </nav>

            <div className="flex items-center gap-2">
              <NotificationBell />
              {user ? (
                <button onClick={handleLogout} className="p-3 text-slate-400 hover:text-rose-500 transition-all">
                  <LogOut size={22} />
                </button>
              ) : (
                <Link href="/login" className="p-3 bg-teal-600 text-white rounded-2xl hover:bg-slate-900 transition-all shadow-lg">
                  <LogIn size={22} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* SIDEBAR */}
      <aside className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-500 ease-in-out z-[60] border-r border-slate-50 ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-8 flex flex-col h-full">
          <div className="flex items-center justify-between mb-10">
            <span className="font-black italic text-xl tracking-tighter text-teal-600">Lisible.</span>
            <button onClick={() => setIsMenuOpen(false)} className="p-2 text-slate-400"><X size={24} /></button>
          </div>

          {user && (
            <Link href="/account" onClick={() => setIsMenuOpen(false)} className="mb-10 p-5 bg-slate-50 hover:bg-teal-50 rounded-[2rem] flex items-center justify-between gap-4 border border-slate-100 transition-all group">
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="shrink-0 w-12 h-12 bg-slate-200 rounded-2xl overflow-hidden border-2 border-white shadow-lg">
                  {user.profilePic ? <img src={user.profilePic} className="w-full h-full object-cover" alt="P" /> : <div className="w-full h-full bg-teal-600 text-white flex items-center justify-center font-black">{user.name?.charAt(0)}</div>}
                </div>
                <div className="text-left overflow-hidden">
                  <p className="text-sm font-black text-slate-900 truncate">{user.penName || user.name}</p>
                  <p className="text-[9px] uppercase font-black text-teal-600">Mon Profil</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </Link>
          )}

          <nav className="space-y-1">
            {menuItems.map((item) => (item.authRequired && !user ? null : (
              <Link key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)} className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all font-bold text-sm ${pathname === item.href ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:bg-teal-50 hover:text-teal-600"}`}>
                <span className={pathname === item.href ? "text-teal-400" : "text-slate-400"}>{item.icon}</span>
                <span className="flex-grow">{item.label}</span>
                {item.href === "/lisible-club" && isLiveActive && <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />}
              </Link>
            )))}
          </nav>
        </div>
      </aside>

      {isMenuOpen && <div onClick={() => setIsMenuOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 animate-in fade-in" />}
      <div className="h-20" />
    </>
  );
}

function NavLink({ href, icon, active, title }) {
  return (
    <Link href={href} title={title} className={`p-3 rounded-2xl transition-all relative ${active ? "bg-white text-teal-600 shadow-sm" : "text-slate-400 hover:text-slate-900 hover:bg-white"}`}>
      {icon}
      {active && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-teal-600 rounded-full" />}
    </Link>
  );
}
