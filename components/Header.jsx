// components/Header.jsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function Header() {
  const pathname = usePathname();

  const navLinks = [
    { name: "Accueil", href: "/" },
    { name: "Bibliothèque", href: "/texts" },
    { name: "Publier", href: "/publish" },
  ];

  return (
    <header className="fixed top-0 left-0 w-full h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50 flex items-center justify-between px-6 transition-all">
      {/* Logo / Titre */}
      <Link 
        href="/" 
        className="text-2xl font-black italic tracking-tighter text-slate-900 hover:opacity-80 transition-opacity"
      >
        Lisible<span className="text-accent">.</span>
      </Link>

      {/* Navigation */}
      <nav className="flex items-center space-x-8">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-[10px] font-black uppercase tracking-[0.2em] transition-colors",
                isActive 
                  ? "text-accent" 
                  : "text-slate-400 hover:text-slate-900"
              )}
            >
              {link.name}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
