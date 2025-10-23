import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import "./globals.css"; // optionnel, si tu utilises un fichier global CSS

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <title>Lisible Club</title>
        <meta
          name="description"
          content="Lisible Club — espace de publication et de lecture collaboratif"
        />
      </head>
      <body className="bg-gray-50 text-gray-900">
        {children}

        {/* ✅ Notifications globales */}
        <Toaster richColors position="top-center" expand />

        {/* 📊 Analytics Vercel */}
        <Analytics />
      </body>
    </html>
  );
}