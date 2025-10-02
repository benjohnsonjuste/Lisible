// components/ui/Header.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "../../utils/cn";
import Button from "./Button";
import AppIcon from "./AppIcon"; // ton composant pour le logo / icônes
import InstallPrompt from "./InstallPrompt";
import { Menu, HelpCircle, User, BarChart3, BookOpen, LogOut, PlusHorizontal } from "lucide-react";

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
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
    setIsMoreMenuOpen(false);
  };

  const handleLogout = () => {
    // log out logic ici
    navigate("/login");
  };

  const isActivePath = (path) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border shadow-sm">
      <div className="flex justify-between items-center h-16 px-4">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <AppIcon size={32} />
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
                iconName={Icon}
                iconPosition="left"
                size={18}
                className={cn(
                  "px-4 py-2 text-sm",
                  isActivePath(item.path) && "text-primary font-semibold"
                )}
                onClick={() => handleNavigation(item.path)}
              >
                {item.label}
              </Button>
            );
          })}
        </nav>

        {/* Menu actions secondaires et menu plus */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            iconName={PlusHorizontal}
            size={18}
            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            className="p-2"
          />
          {isMoreMenuOpen && (
            <div className="absolute right-4 top-16 w-48 bg-popover border border-border rounded-lg shadow-md py-2 animate-fade-in">
              {secondaryNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.path}
                    variant="ghost"
                    iconName={Icon}
                    iconPosition="left"
                    size={18}
                    fullWidth
                    className="px-4 py-2 text-sm hover:bg-muted"
                    onClick={() => handleNavigation(item.path)}
                  >
                    {item.label}
                  </Button>
                );
              })}
              <Button
                variant="ghost"
                iconName={LogOut}
                iconPosition="left"
                size={18}
                fullWidth
                className="px-4 py-2 text-sm text-destructive hover:text-destructive-foreground"
                onClick={handleLogout}
              >
                Déconnexion
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