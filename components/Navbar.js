"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NotificationBell from "@/components/NotificationBell"; // Import de notre cloche intelligente

// Icônes lucide-react
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
  X
} from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // Vérification de la session locale au chargement et lors des changements
    const checkUser = () => {
      const loggedUser = localStorage.getItem("lisible_user");
      if (loggedUser) {
        setUser(JSON.parse(loggedUser));
      } else {
        setUser(null);
      }
    };

    checkUser();
    // On écoute les changements de stockage (utile si on se déconnecte dans un autre onglet)
    window.addEventListener('storage', checkUser);
    return () => window.removeEventListener('storage', checkUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("lisible_user");
    setUser(null);
    setIsMenuOpen(false);
    router.push("/login");
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const handleMenuClick = () => setIsMenuOpen(false);

  return (
    <>
      {/* ======= HEADER ======= */}
      <header className="bg-indigo-900 shadow-xl fixed top-0 left-0 w-full z-50 h-16 border-b border-indigo-800">
        <div className="container mx-auto h-full flex items-center justify-between px-4 text-white">
          
          {/* Gauche : Menu et Logo */}
          <div className="flex items-center gap-4">
            <button onClick={toggleMenu} className="cursor-pointer p-2 hover:bg-white/10 rounded-xl transition-all">
              {isMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
            <Link href="/" className="font-black text-xl tracking-tighter hidden sm:block">
              LISIBLE
            </Link>
          </div>

          {/* Zone droite : Actions */}
          <div className="flex items-center gap-2 sm:gap-5">
            
            {/* La cloche intelligente adaptée au système GitHub */}
            <NotificationBell />

            <Link href="/" title="Accueil" className="p-2 hover:bg-white/10 rounded-xl transition-all">
              <Home className="w-7 h-7" />
            </Link>

            <Link href="/bibliotheque" title="Bibliothèque" className="p-2 hover:bg-white/10 rounded-xl transition-all">
              <Library className="w-7 h-7" />
            </Link>

            <Link href="/dashboard" title="Tableau de bord" className="p-2 hover:bg-white/10 rounded-xl transition-all">
              <LayoutDashboard className="w-7 h-7" />
            </Link>

            <div className="h-8 w-[1px] bg-white/20 mx-1"></div>

            {user ? (
              <button 
                onClick={handleLogout} 
                title="Déconnexion"
                className="p-2 hover:bg-red-500/20 text-red-400 rounded-xl transition-all"
              >
                <LogOut className="w-7 h-7" />
              </button>
            ) : (
              <Link href="/login" title="Connexion" className="p-2 hover:bg-green-500/20 text-green-400 rounded-xl transition-all">
                <LogIn className="w-7 h-7" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ======= SIDEBAR (MENU LATÉRAL) ======= */}
      <aside
        className={`fixed top-16 left-0 h-[calc(100%-4rem)] w-72 bg-white shadow-2xl transform transition-transform duration-500 ease-in-out z-50 rounded-r-[2rem] border-r border-gray-100 ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-8 flex flex-col h-full">
          {user && (
            <div className="mb-8 p-4 bg-gray-50 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-black text-gray-900 truncate">{user.name}</p>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Auteur</p>
              </div>
            </div>
          )}

          <nav className="flex-grow">
            <ul className="space-y-2">
              {[
                { href: "/users", label: "Nos Auteurs", icon: <Users className="w-5 h-5" /> },
                { href: "/lisible-club", label: "Lisible Club", icon: <MessageCircle className="w-5 h-5" /> },
                { href: "/evenements", label: "Événements", icon: <Calendar className="w-5 h-5" /> },
                { href: "/terms", label: "Conditions", icon: <FileText className="w-5 h-5" /> },
                { href: "/contact", label: "Contact", icon: <MessageCircle className="w-5 h-5" /> },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={handleMenuClick}
                    className="flex items-center gap-4 px-4 py-3 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all font-bold text-sm"
                  >
                    <span className="p-2 bg-gray-50 rounded-lg group-hover:bg-white transition-colors">
                        {item.icon}
                    </span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-auto pt-6 border-t border-gray-100">
             <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest text-center">
                Lisible © 2026
             </p>
          </div>
        </div>
      </aside>

      {/* ======= OVERLAY (FLOU DE FOND) ======= */}
      {isMenuOpen && (
        <div
          onClick={toggleMenu}
          className="fixed inset-0 bg-indigo-950/40 backdrop-blur-sm z-40 transition-opacity"
        />
      )}
    </>
  );
}
