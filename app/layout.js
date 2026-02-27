"use client";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "sonner";
import { Inter, Lora } from 'next/font/google';
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import dynamic from "next/dynamic";
import LiveNotificationListener from "@/components/LiveNotificationListener";
import PushActivation from "@/components/PushActivation";

// Chargement dynamique du composant InstallPrompt pour éviter l'erreur "window is not defined" (SSR)
const InstallPrompt = dynamic(() => import("@/components/InstallPrompt"), { 
  ssr: false 
});

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap',
});

const lora = Lora({ 
  subsets: ['latin'], 
  style: ['italic', 'normal'], 
  variable: '--font-lora',
  display: 'swap',
});

// 1. Exportation séparée pour le Viewport (Correctif Next.js 14)
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0f172a",
};

// 2. Metadata nettoyées
export const metadata = {
  title: "Lisible | L'Élite de la Plume",
  description: "Le sanctuaire numérique de la littérature moderne et du streaming littéraire.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    shortcut: "/favicon.ico",
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Lisible",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${inter.variable} ${lora.variable} h-full`} suppressHydrationWarning>
      <head>
        {/* Google AdSense Validation Code */}
        <script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7644995408680119"
          crossOrigin="anonymous"
        ></script>
        
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  const supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (theme === 'dark' || (!theme && supportDarkMode)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased bg-[#fcfbf9] text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-500 font-sans flex flex-col min-h-screen selection:bg-teal-100 selection:text-teal-900">
        <AuthProvider>
          <ServiceWorkerRegistration />
          {/* Systèmes de notification et d'écoute */}
          <LiveNotificationListener />
          <PushActivation />
          
          <Navbar />
          <main className="flex-1 w-full pt-20 relative">
            {children}
          </main>
          <InstallPrompt />
          <Footer />
          <Toaster 
            position="top-center" 
            richColors 
            closeButton 
            expand={false}
            toastOptions={{
              style: { 
                borderRadius: '1.25rem',
                border: 'none',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
              },
            }}
          />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
