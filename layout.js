import "./globals.css";
import { Toaster } from "sonner";
import Navbar from "@/components/Navbar";
import NotificationInitializer from "@/components/NotificationInitializer";
import InstallPrompt from "@/components/InstallPrompt";
import Script from "next/script";

export const metadata = {
  title: "Lisible - L'Arène des Mots",
  description: "Plateforme de streaming littéraire produite par La Belle Littéraire. Votre plume, votre communauté.",
  manifest: "/manifest.json", 
  themeColor: "#0f172a", // Slate-900 pour une intégration premium sur mobile
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0", 
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="scroll-smooth">
      <body className="bg-slate-50 antialiased text-slate-900 font-sans selection:bg-teal-500 selection:text-white">
        
        {/* 1. INITIALISATIONS CLIENT (PWA & Notifications) */}
        <NotificationInitializer />
        <InstallPrompt />

        {/* 2. NAVBAR FIXE AVEC EFFET DE TRANSPARENCE AVANCÉ */}
        <header className="fixed top-0 left-0 right-0 z-[100] bg-white/70 backdrop-blur-xl border-b border-slate-100/50 shadow-sm shadow-slate-200/20">
          <Navbar />
        </header>

        {/* 3. CONTENU PRINCIPAL AVEC LISSAGE DE TRANSITION */}
        <main className="pt-28 pb-12 min-h-screen">
          <div className="max-w-6xl mx-auto px-5 md:px-10">
            {children}
          </div>
        </main>

        {/* 4. SYSTÈME DE TOASTS ÉLITE */}
        <Toaster 
          richColors 
          closeButton
          position="top-center" 
          toastOptions={{
            style: { 
              borderRadius: '1.5rem', 
              padding: '1.25rem',
              border: '1px solid #f1f5f9',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
            },
          }}
        />

        {/* 5. ENREGISTREMENT DU SERVICE WORKER (PWA) */}
        <Script id="pwa-sw-registration" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(reg) {
                  console.log('Lisible SW Ready:', reg.scope);
                }).catch(function(err) {
                  console.error('SW Error:', err);
                });
              });
            }
          `}
        </Script>

      </body>
    </html>
  );
}
