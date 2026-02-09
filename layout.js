// app/layout.js
import "@/styles/globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import InstallPrompt from "@/components/InstallPrompt";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "sonner";
import { Inter, Lora } from 'next/font/google';

// Font Sans-Serif pour l'interface UI (Atelier, Menu, Dash)
const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap',
});

// Font Serif pour la lecture immersive (Textes, Prose, Poésie)
const lora = Lora({ 
  subsets: ['latin'], 
  style: ['italic', 'normal'], 
  variable: '--font-lora',
  display: 'swap',
});

export const metadata = {
  title: "Lisible | L'Élite de la Plume",
  description: "Le sanctuaire numérique de la littérature moderne et du streaming littéraire.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover",
  themeColor: "#0f172a",
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
        {/* Script d'injection du thème pour éviter le Flash of Unstyled Content (FOUC) */}
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
          {/* Interface Globale */}
          <Navbar />
          
          {/* Main Content : pt-20 pour laisser respirer la Navbar fixée */}
          <main className="flex-1 w-full pt-20 relative">
            {children}
          </main>
          
          {/* Outils & Notifications */}
          <InstallPrompt />
          <Footer />
          
          {/* Toaster stylisé Lisible */}
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
