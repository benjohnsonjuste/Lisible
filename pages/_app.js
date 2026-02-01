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
        <title>Lisible | L'Élite de la Plume</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/> 
        
        {/* Favicon pour navigateur */}
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="shortcut icon" href="/favicon.ico" />

        {/* Configuration PWA */}
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />

        {/* Couleur de thème adaptée à ton identité Teal/Slate */}
        <meta name="theme-color" content="#0f172a" />
      </Head>

      {/* Barre de navigation : Assure-toi qu'elle gère l'affichage du solde Li */}
      <Navbar />

      {/* Contenu principal : 
          J'ai retiré 'container-md' pour laisser tes composants 
          (Dashboard, Shop, etc.) gérer leurs propres marges.
      */}
      <main className="min-h-screen pt-4 pb-20">
        <Component {...pageProps} />
      </main>

      {/* Bannière d’installation PWA */}
      <InstallPrompt />

      {/* Pied de page */}
      <Footer />

      {/* Notifications (Toaster) : 
          Position "top-center" est souvent plus élégante sur mobile 
          pour les confirmations de transactions (Li envoyés).
      */}
      <Toaster position="top-center" richColors closeButton expand={false} />

      {/* Suivi Vercel Analytics */}
      <Analytics />
    </AuthProvider>
  );
}

export default MyApp;
