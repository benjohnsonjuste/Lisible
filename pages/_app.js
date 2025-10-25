"use client";

import "@/styles/globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import InstallPrompt from "@/components/InstallPrompt";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "sonner";
import Head from "next/head";

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Head>
        {/* Favicon pour navigateur */}
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/favicon.ico" sizes="16x16" />
        <link rel="shortcut icon" href="/favicon.ico" />

        {/* Icônes PWA pour mobile */}
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon.ico" />
        <link rel="manifest" href="/favicon.ico" />

        {/* Couleur de thème pour la barre du navigateur et notifications */}
        <meta name="theme-color" content="#0d6efd" />
      </Head>

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