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
        {/* S'affiche sur toutes les pages */}
        <Navbar />
        
        {/* Contenu principal qui pousse le footer vers le bas */}
        <main className="flex-grow">
          {children}
        </main>
        
        {/* S'affiche sur toutes les pages */}
        <Footer />
        
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
