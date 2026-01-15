"use client";

import { useEffect } from "react";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import "@/app/globals.css";
import NotificationCenter from "@/components/NotificationCenter";
import InstallPrompt from "@/components/InstallPrompt";
import { useSession } from "next-auth/react";
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({ children }) {
  const { data: session } = useSession();

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then(() => console.log("✅ Service Worker enregistré"))
        .catch((err) =>
          console.error("❌ Erreur d’enregistrement du Service Worker :", err)
        );
    }
  }, []);

  return (
    <html lang="fr" className="h-full">
      <head>
        <title>Lisible</title>
        <meta
          name="description"
          content="Lisible Club — espace de publication et de lecture collaboratif"
        />
        <meta name="theme-color" content="#1e3a8a" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Lisible" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>

      <body className="min-h-screen bg-gray-50 text-gray-900 m-0 p-0 overflow-x-hidden">
        <AuthProvider>
          {/* =====================
               HEADER FIXE
          ===================== */}
          <header className="fixed top-0 left-0 w-full bg-white shadow z-50 border-b border-gray-200">
            <div className="max-w-7xl mx-auto flex items-center justify-between p-4">
              <h1 className="text-xl font-bold">Lisible</h1>
              <nav className="space-x-4">
                <button>Accueil</button>
                <button>Bibliothèque</button>
                <button>Publier</button>
                <button>Profil</button>
              </nav>
            </div>
          </header>

          {/* =====================
               CONTENU PRINCIPAL
               → PADDING-TOP pour éviter chevauchement
          ===================== */}
          <main className="pt-20">{children}</main>

          {/* Notification Center */}
          {session?.user?.id && (
            <NotificationCenter userId={session.user.id} />
          )}

          {/* Toaster */}
          <Toaster richColors position="top-center" expand />

          {/* Bannière PWA */}
          <InstallPrompt />

          {/* Analytics */}
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}