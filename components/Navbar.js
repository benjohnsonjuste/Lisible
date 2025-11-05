"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; 
import { auth } from "@/lib/firebaseConfig";
import { signOut, onAuthStateChanged } from "firebase/auth";

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
  Bell,
} from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (e) {
      console.error("Erreur de déconnexion :", e);
    }
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const handleMenuClick = () => setIsMenuOpen(false);

  const goToNotifications = () => {
    router.push("/notifications");
  };

  return (
    <>
      {/* ======= HEADER ======= */}
      <header className="bg-primary shadow fixed top-0 left-0 w-full z-50">
        <div className="container mx-auto flex items-center justify-between py-3 px-4 text-white">
          {/* Bouton menu latéral */}
          <button onClick={toggleMenu} className="cursor-pointer z-[60]">
            <Menu className="w-8 h-8 text-white hover:text-blue-300 transition" />
          </button>

          {/* Zone droite */}
          <div className="flex items-center gap-5">
            {/* Icône notification */}
            <button
              onClick={goToNotifications}
              className="relative cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-8 h-8 text-white hover:text-yellow-300 transition" />
            </button>

            <Link href="/index" className="cursor-pointer">
              <Home className="w-8 h-8 text-white hover:text-blue-300 transition" />
            </Link>

            <Link href="/bibliotheque" className="cursor-pointer">
              <Library className="w-8 h-8 text-white hover:text-blue-300 transition" />
            </Link>

            <Link href="/author-dashboard" className="cursor-pointer">
              <LayoutDashboard className="w-8 h-8 text-white hover:text-blue-300 transition" />
            </Link>

            {user ? (
              <button
                onClick={handleLogout}
                className="cursor-pointer"
                title="Déconnexion"
              >
                <LogOut className="w-8 h-8 text-white hover:text-red-500 transition" />
              </button>
            ) : (
              <Link href="/login" className="cursor-pointer">
                <LogIn className="w-8 h-8 text-white hover:text-green-500 transition" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ======= SIDEBAR ======= */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 z-50 ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-5 pt-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">Menu</h2>

          <ul className="space-y-4">
            {[
              { href: "/users", label: "Nos Auteurs", icon: <Users className="w-5 h-5" /> },
              { href: "/lisible-club", label: "Lisible Club", icon: <MessageCircle className="w-5 h-5" /> },
              { href: "/evenements", label: "Événements", icon: <Calendar className="w-5 h-5" /> },
              { href: "/terms", label: "Conditions d'utilisation", icon: <FileText className="w-5 h-5" /> },
              { href: "/contact", label: "Contact", icon: <MessageCircle className="w-5 h-5" /> },
            ].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={handleMenuClick}
                  className="flex items-center gap-3 text-gray-700 hover:text-blue-600 cursor-pointer"
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* ======= OVERLAY ======= */}
      {isMenuOpen && (
        <div
          onClick={toggleMenu}
          className="fixed inset-0 bg-black bg-opacity-40 z-40 cursor-pointer"
        />
      )}
    </>
  );
}