// components/ui/Header.jsx
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { cn } from "../../utils/cn";
import { Bouton } from "./Bouton"; // corrige : import du vrai bouton
import AppIcon from "./AppIcon";   // logo / icônes
import InstallPrompt from "./InstallPrompt";
import {
  HelpCircle,
  User,
  BarChart3,
  BookOpen,
  LogOut,
  PlusHorizontal,
} from "lucide-react";

const primaryNavItems = [
  { label: "Tableau de bord", path: "/dashboard", icon: BarChart3 },
  { label: "Publier", path: "/publish", icon: BookOpen },
  { label: "Gestion de compte", path: "/account", icon: User },
];

const secondaryNavItems = [
  { label: "Paramètres", path: "/settings", icon: User },
  { label: "Aide", path: "/help", icon: HelpCircle },
];

const Header = () => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const router = useRouter();

  const handleNavigation = (path) => {
    router.push(path);
    setIsMoreMenuOpen(false);
  };

  const handleLogout = () => {
    // log out logic (à connecter avec Firebase/Auth plus tard)
    router.push("/login");
  };

  const isActivePath = (path) => router.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border shadow-sm">
      <div className="flex justify-between items-center h-16 px-4">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <AppIcon src="/icon.png" alt="Lisible Logo" className="w-8 h-8" />
          <span className="font-semibold text-lg text-primary">Lisible</span>
        </div>

        {/* Navigation principale */}
        <nav className="hidden md:flex space-x-4">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.path}
                variant="ghost"
                className={cn(
                  "px-4 py-2 text-sm flex items-center space-x-2",
                  isActivePath(item.path) && "text-primary font-semibold"
                )}
                onClick={() => handleNavigation(item.path)}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Button>
            );
          })}
        </nav>

        {/* Menu actions secondaires et menu plus */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            className="p-2"
            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
          >
            <PlusHorizontal className="w-5 h-5" />
          </Button>

          {isMoreMenuOpen && (
            <div className="absolute right-4 top-16 w-48 bg-popover border border-border rounded-lg shadow-md py-2 animate-fade-in">
              {secondaryNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.path}
                    variant="ghost"
                    className="px-4 py-2 text-sm flex items-center space-x-2 hover:bg-muted w-full"
                    onClick={() => handleNavigation(item.path)}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Button>
                );
              })}

              <Button
                variant="ghost"
                className="px-4 py-2 text-sm flex items-center space-x-2 text-destructive hover:text-destructive-foreground w-full"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                <span>Déconnexion</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Composant InstallPrompt PWA */}
      <InstallPrompt />
    </header>
  );
};

export default Header;