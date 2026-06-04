import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "sonner";
import { Inter, Lora } from 'next/font/google';
import dynamic from "next/dynamic";
import Script from "next/script"; // 1. IMPORTATION DU COMPOSANT SCRIPT DE NEXT.JS

// --- CHARGEMENT DYNAMIQUE (Client-side only) ---
const ServiceWorkerRegistration = dynamic(() => import("@/components/ServiceWorkerRegistration"), { 
  ssr: false 
});

const InstallPrompt = dynamic(() => import("@/components/InstallPrompt"), { 
  ssr: false 
});

const LiveNotificationListener = dynamic(() => import("@/components/LiveNotificationListener"), { 
  ssr: false 
});

const PushActivation = dynamic(() => import("@/components/PushActivation"), { 
  ssr: false 
});

// --- POLICES ---
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

// --- METADATA ---
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0f172a",
};

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
  other: {
    monetag: "1de0443ac642abc60ec1f6ad3f4081b6",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${inter.variable} ${lora.variable} h-full`} suppressHydrationWarning>
      <head>
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
      <body className="antialiased bg-[#fcfbf9] text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-500 font-sans flex flex-col min-h-screen selection:bg-blue-100 selection:text-blue-900">
        
        {/* 2. INSERTION DU SCRIPT PUBLICITAIRE */}
        <Script 
          src="https://quge5.com/88/tag.min.js" 
          data-zone="246262" 
          strategy="afterInteractive"
          data-cfasync="false"
        />

        <AuthProvider>
          {/* Composants Clients isolés du SSR */}
          <ServiceWorkerRegistration />
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
