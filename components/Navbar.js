"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";

import {
  Menu,
  Home,
  Library,
  LayoutDashboard,
  LogOut,
  LogIn,
  Users,
  MessageCircle,
  Calendar,
  FileText,
  X,
  Sparkles,
  ChevronRight
} from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const checkUser = () => {
      const loggedUser = localStorage.getItem("lisible_user");
      setUser(loggedUser ? JSON.parse(loggedUser) : null);
    };

    checkUser();
    window.addEventListener('storage', checkUser);
    return () => window.removeEventListener('storage', checkUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("lisible_user");
    setUser(null);
    setIsMenuOpen(false);
    router.push("/login");
  };

  const menuItems = [
    { href: "/communaute", label: "Communauté", icon: <Users size={20} /> },
    { href: "/evenements", label: "Événements", icon: <Calendar size={20} /> },
    { href: "/contact", label: "Contact", icon: <MessageCircle size={20} /> },
    { href: "/terms", label: "Conditions", icon: <FileText size={20} /> },
  ];

  return (
    <>
      {/* ======= HEADER ======= */}
      <header className="bg-white/80 backdrop-blur-md fixed top-0 left-0 w-full z-50 h-20 border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-6">
          
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="p-3 bg-slate-50 text-slate-600 hover:bg-teal-50 hover:text-teal-600 rounded-2xl transition-all active:scale-95 shadow-sm border border-slate-100"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link href="/" className="group flex items-center gap-2">
              <span className="font-black text-2xl tracking-tighter text-slate-900 italic group-hover:text-teal-600 transition-colors">
                Lisible.
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <nav className="hidden md:flex items-center gap-1 bg-slate-50 p-1.5 rounded-[1.5rem] border border-slate-100">
              <NavLink href="/" icon={<Home size={20} />} active={pathname === "/"} title="Accueil" />
              <NavLink href="/bibliotheque" icon={<Library size={20} />} active={pathname === "/bibliotheque"} title="Bibliothèque" />
              <NavLink href="/dashboard" icon={<LayoutDashboard size={20} />} active={pathname === "/dashboard"} title="Tableau de bord" />
            </nav>

            <div className="flex items-center gap-2">
              <NotificationBell />
              {user ? (
                <button 
                  onClick={handleLogout} 
                  className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                  title="Déconnexion"
                >
                  <LogOut size={22} />
                </button>
              ) : (
                <Link 
                  href="/login" 
                  className="p-3 bg-teal-600 text-white rounded-2xl hover:bg-slate-900 transition-all shadow-lg shadow-teal-100"
                >
                  <LogIn size={22} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ======= SIDEBAR ======= */}
      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-500 ease-in-out z-[60] border-r border-slate-50 ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-8 flex flex-col h-full">
          <div className="flex items-center justify-between mb-10">
            <span className="font-black italic text-xl tracking-tighter text-teal-600">Lisible.</span>
            <button onClick={() => setIsMenuOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
              <X size={24} />
            </button>
          </div>

          {/* User Profile - MAINTENANT CLIQUABLE VERS /ACCOUNT */}
          {user && (
            <Link 
              href="/account" 
              onClick={() => setIsMenuOpen(false)}
              className="mb-10 p-5 bg-slate-50 hover:bg-teal-50 rounded-[2rem] flex items-center justify-between gap-4 border border-slate-100 hover:border-teal-100 transition-all group"
            >
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="shrink-0 w-12 h-12 bg-teal-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-teal-200/50 transition-transform group-hover:scale-105 group-hover:rotate-3">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden text-left">
                  <p className="text-sm font-black text-slate-900 truncate group-hover:text-teal-700 transition-colors">{user.name}</p>
                  <div className="flex items-center gap-1 text-teal-600/70">
                    <Sparkles size={10} fill="currentColor" />
                    <p className="text-[9px] uppercase font-black tracking-widest">Mon Compte</p>
                  </div>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-300 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
            </Link>
          )}

          <nav className="space-y-2">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] ml-4 mb-4">Explorer</p>
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm group ${
                  pathname === item.href ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "text-slate-500 hover:bg-slate-50 hover:text-teal-600"
                }`}
              >
                <span className={`${pathname === item.href ? "text-teal-400" : "text-slate-400 group-hover:text-teal-600"} transition-colors`}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto pt-8 border-t border-slate-50 text-center">
             <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.3em]">
                Lisible par La Belle Littéraire
             </p>
          </div>
        </div>
      </aside>

      {/* ======= OVERLAY ======= */}
      {isMenuOpen && (
        <div
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity animate-in fade-in"
        />
      )}

      <div className="h-20" />
    </>
  );
}

function NavLink({ href, icon, active, title }) {
  return (
    <Link 
      href={href} 
      title={title}
      className={`p-3 rounded-2xl transition-all relative group ${
        active 
        ? "bg-white text-teal-600 shadow-sm" 
        : "text-slate-400 hover:text-slate-900 hover:bg-white"
      }`}
    >
      {icon}
      {active && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-teal-600 rounded-full" />
      )}
    </Link>
  );
}
