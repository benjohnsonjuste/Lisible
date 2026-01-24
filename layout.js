import "./globals.css";
import { Toaster } from "sonner";
import Navbar from "@/components/Navbar";

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="bg-gray-50 antialiased text-gray-900 font-sans">
        {/* LA NAVBAR : Fixée en haut pour tout le site */}
        <div className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-md border-b border-gray-100">
          <Navbar />
        </div>

        {/* LE CONTENU : Automatiquement poussé vers le bas pour ne pas être caché */}
        {/* pt-20 (80px) assure que le titre de tes pages commence sous la navbar */}
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
