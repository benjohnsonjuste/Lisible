"use client";

import "@/styles/globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import InstallPrompt from "@/components/InstallPrompt";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "sonner";
import Head from "next/head";
import { Inter, Playfair_Display } from 'next/font/google';

// Configuration des polices
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], style: ['italic', 'normal'], variable: '--font-playfair' });

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Head>
        <title>Lisible | L'Élite de la Plume</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/> 
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
      </Head>

      <div className={`${inter.variable} ${playfair.variable} font-sans`}>
        <Navbar />
        <main className="min-h-screen pt-4 pb-20">
          <Component {...pageProps} />
        </main>
        <InstallPrompt />
        <Footer />
        <Toaster position="top-center" richColors closeButton expand={false} />
        <Analytics />
      </div>
    </AuthProvider>
  );
}

export default MyApp;
