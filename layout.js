import "./globals.css";
import { Toaster } from "sonner";

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="bg-gray-50">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}