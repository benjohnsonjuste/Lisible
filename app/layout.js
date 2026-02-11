import "./globals.css";
import { Toaster } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: 'Lisible - Lecture en streaming',
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
