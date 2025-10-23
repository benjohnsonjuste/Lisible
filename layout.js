import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import "@/styles/globals.css"; // ✅ import global avec alias @

export default function RootLayout({ children }) {
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
