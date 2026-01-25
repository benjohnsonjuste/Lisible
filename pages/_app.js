"use client";

import "@/styles/globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import InstallPrompt from "@/components/InstallPrompt";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "sonner";
import Head from "next/head";
import Script from "next/script"; // 1. Import du composant Script

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
        <link rel="manifest" href="/manifest.json" />

        {/* Couleur de thème pour la barre du navigateur et notifications */}
        <meta name="theme-color" content="#0d6efd" />
      </Head>

      {/* 2. Intégration du script publicitaire EffectiveGate */}
      <Script 
        src="https://pl28553504.effectivegatecpm.com/f3/ab/7f/f3ab7f753d7d49a90e198d67c43c6991.js"
        strategy="afterInteractive" 
      />

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
