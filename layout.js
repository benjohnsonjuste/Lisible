import "./globals.css";
import { Toaster } from "sonner";
import Navbar from "@/components/Navbar";
import NotificationInitializer from "@/components/NotificationInitializer";
import InstallPrompt from "@/components/InstallPrompt";

export const metadata = {
  title: "Lisible - Votre plume, votre communauté",
  description: "Plateforme littéraire, PWA et streaming live pour auteurs passionnés.",
  manifest: "/manifest.json", // Essentiel pour le bouton d'installation
  themeColor: "#14b8a6", // Couleur Teal-500 pour le navigateur
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="bg-gray-50 antialiased text-gray-900 font-sans selection:bg-teal-100 selection:text-teal-900">
        
        {/* 1. INITIALISATIONS CLIENT (Logique éphémère et PWA) */}
        <NotificationInitializer />
        <InstallPrompt />

        {/* 2. NAVBAR FIXE */}
        <header className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm shadow-slate-200/20">
          <Navbar />
        </header>

        {/* 3. CONTENU PRINCIPAL */}
        {/* pt-24 permet d'éviter que le contenu passe sous la navbar (80px + marge) */}
        <main className="pt-24 pb-12 min-h-screen">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            {children}
          </div>
        </main>

        {/* 4. SYSTÈME DE TOASTS (Notifications visuelles in-app) */}
        <Toaster 
          richColors 
          position="top-center" 
          toastOptions={{
            style: { borderRadius: '1.25rem', padding: '1rem' },
          }}
        />

      </body>
    </html>
  );
}
