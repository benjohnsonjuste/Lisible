import "./globals.css";
import { Toaster } from "sonner";
import Navbar from "@/components/Navbar";
import NotificationInitializer from "@/components/NotificationInitializer"; // On va créer ce composant

export const metadata = {
  title: "Lisible - Votre plume, votre communauté",
  description: "Plateforme littéraire et streaming live pour auteurs passionnés.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="bg-gray-50 antialiased text-gray-900 font-sans">
        {/* INITIALISATION ONESIGNAL (Client-side) */}
        <NotificationInitializer />

        {/* LA NAVBAR */}
        <div className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-md border-b border-gray-100">
          <Navbar />
        </div>

        {/* LE CONTENU */}
        <main className="pt-24 pb-12 min-h-screen">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            {children}
          </div>
        </main>

        {/* Notifications globales */}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
