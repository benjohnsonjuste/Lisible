// app/layout.js
import "@/styles/globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import InstallPrompt from "@/components/InstallPrompt";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "sonner";
import { Inter, Playfair_Display } from 'next/font/google';

// Configuration des polices (côté serveur)
const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({ 
  subsets: ['latin'], 
  style: ['italic', 'normal'], 
  variable: '--font-playfair',
  display: 'swap',
});

// Metadata (remplace l'ancien composant <Head>)
export const metadata = {
  title: "Lisible | L'Élite de la Plume",
  description: "Le sanctuaire numérique de la littérature moderne.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
  themeColor: "#0f172a",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen pt-4 pb-20">
            {children}
          </main>
          <InstallPrompt />
          <Footer />
          <Toaster position="top-center" richColors closeButton expand={false} />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
