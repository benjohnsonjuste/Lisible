"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { auth } from "@/lib/firebaseConfig";
import { signOut, onAuthStateChanged } from "firebase/auth";
import NotificationBell from "@/components/NotificationBell";

// Import des icônes lucide-react
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

  return (
    <>
      {/* ======= HEADER PRINCIPAL ======= */}
      <header className="bg-primary shadow relative z-50">
        <div className="container-lg flex items-center justify-between py-4 px-4 text-white">
          {/* Bouton menu */}
          <button onClick={toggleMenu} className="cursor-pointer">
            <Menu className="w-8 h-8 text-white" />
          </button>

          {/* Zone droite : Notifications + Auth */}
          <div className="flex items-center gap-6">
            <NotificationBell />

            <Link href="/club">
              <Library className="w-8 h-8 text-white hover:text-blue-300 transition" />
            </Link>

            <Link href="/author-dashboard">
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
              <Link href="/AuthDialog">
                <LogIn className="w-8 h-8 text-white hover:text-green-500 transition" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ======= SIDEBAR ======= */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 z-40 ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">Menu</h2>

          <ul className="space-y-4">
            {[
              { href: "/account-management", label: "Mon compte", icon: <Users className="w-5 h-5" /> },
              { href: "/lisible-club", label: "Lisible Club", icon: <MessageCircle className="w-5 h-5" /> },
              { href: "/evenements", label: "Événements", icon: <Calendar className="w-5 h-5" /> },
              { href: "/terms", label: "Conditions d'utilisation", icon: <FileText className="w-5 h-5" /> },
              { href: "/contact", label: "Contact", icon: <MessageCircle className="w-5 h-5" /> },
            ].map((item) => (
              <li key={item.href}>
                <Link href={item.href}>
                  <span
                    onClick={handleMenuClick}
                    className="flex items-center gap-3 hover:text-blue-600 cursor-pointer"
                  >
                    {item.icon}
                    {item.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ======= OVERLAY ======= */}
      {isMenuOpen && (
        <div
          onClick={toggleMenu}
          className="fixed inset-0 bg-black bg-opacity-40 z-30"
        />
      )}
    </>
  );
}
