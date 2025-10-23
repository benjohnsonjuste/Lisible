import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import "@/app/globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <head>
        <title>Lisible</title>
        <meta
          name="description"
          content="Lisible Club — espace de publication et de lecture collaboratif"
        />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900 m-0 p-0 overflow-x-hidden">
        {children}

        {/* Notifications globales */}
        <Toaster richColors position="top-center" expand />

        {/* Analytics */}
        <Analytics />
      </body>
    </html>
  );
}