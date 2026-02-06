import "./globals.css";
import { Toaster } from "sonner";

export const metadata = {
  title: 'Lisible - Publication',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
