"use client";

import "@/styles/globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import InstallPrompt from "@/components/InstallPrompt";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "sonner";

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      {/* Barre de navigation */}
      <Navbar />

      {/* Contenu principal */}
      <main className="container-md py-6">
        <Component {...pageProps} />
      </main>

      {/* Bannière d’installation PWA */}
      <InstallPrompt />

      {/* Pied de page */}
      <Footer />

      {/* Notifications (Toaster) */}
      <Toaster position="top-right" richColors />

      {/* Suivi Vercel Analytics */}
      <Analytics />
    </AuthProvider>
  );
}

export default MyApp;