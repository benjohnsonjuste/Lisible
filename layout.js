"use client";
import "@/app/globals.css";
import Header from "@/components/Header";

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="h-full">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        {/* Header fixe */}
        <Header />

        {/* Contenu principal */}
        <main className="pt-20 max-w-4xl mx-auto p-4">{children}</main>
      </body>
    </html>
  );
}