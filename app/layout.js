import "./globals.css";
import { Toaster } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: 'Lisible - Lecture en streaming',
  description: 'Le Studio Littéraire — Découvrez et partagez des manuscrits modernes.',
  metadataBase: new URL('https://lisible.fr'), // Remplacez par votre domaine réel
  openGraph: {
    title: 'Lisible',
    description: 'Le Grand Livre des manuscrits modernes.',
    url: 'https://lisible.fr',
    siteName: 'Lisible',
    images: [
      {
        url: '/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Lisible — Studio Littéraire',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lisible',
    description: 'Le Grand Livre des manuscrits modernes.',
    images: ['/og-default.jpg'],
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="flex flex-col min-h-screen">
        {/* Navbar fixe en haut */}
        <Navbar />
        
        {/* Le padding-top (pt-20) compense la hauteur de la Navbar fixe.
          La classe 'flex-grow' assure que le footer reste en bas.
        */}
        <main className="flex-grow pt-20 md:pt-24">
          {children}
        </main>
        
        {/* Footer en bas de page */}
        <Footer />
        
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
