import "./globals.css";
import { Toaster } from "sonner";
import Navbar from "@/components/Navbar";
import NotificationInitializer from "@/components/NotificationInitializer";
import InstallPrompt from "@/components/InstallPrompt";
import Script from "next/script";

export const metadata = {
  title: "Lisible - Votre plume, votre communauté",
  description: "Plateforme littéraire, PWA et streaming live pour auteurs passionnés.",
  manifest: "/manifest.json", 
  themeColor: "#14b8a6", 
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="bg-gray-50 antialiased text-gray-900 font-sans selection:bg-teal-100 selection:text-teal-900">
        
        {/* 1. INITIALISATIONS CLIENT (PWA & Notifications) */}
        <NotificationInitializer />
        <InstallPrompt />

        {/* 2. NAVBAR FIXE */}
        <header className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm shadow-slate-200/20">
          <Navbar />
        </header>

        {/* 3. CONTENU PRINCIPAL */}
        <main className="pt-24 pb-12 min-h-screen">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            {children}
          </div>
        </main>

        {/* 4. SYSTÈME DE TOASTS */}
        <Toaster 
          richColors 
          position="top-center" 
          toastOptions={{
            style: { borderRadius: '1.25rem', padding: '1rem' },
          }}
        />

        {/* 5. PUBLICITÉ GLOBALE (Stratégie lazyOnload pour ne pas bloquer le rendu) */}
        <Script 
          src="https://pl28553504.effectivegatecpm.com/f3/ab/7f/f3ab7f753d7d49a90e198d67c43c6991.js"
          strategy="lazyOnload"
        />

        {/* 6. ENREGISTREMENT DU SERVICE WORKER (PWA) */}
        <Script id="pwa-sw-registration" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(reg) {
                  console.log('SW enregistré:', reg.scope);
                }).catch(function(err) {
                  console.error('Erreur SW:', err);
                });
              });
            }
          `}
        </Script>

      </body>
    </html>
  );
}
