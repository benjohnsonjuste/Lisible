import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import "@/app/globals.css";
import NotificationCenter from "@/components/NotificationCenter";
import { useSession } from "next-auth/react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

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
        {session?.user?.id && <NotificationCenter userId={session.user.id} />}

        {/* Toaster pour les notifications instantanées */}
        <Toaster richColors position="top-center" expand />

        {/* Analytics Vercel */}
        <Analytics />
      </body>
    </html>
  );
}