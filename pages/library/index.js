"use client";

import TextLibrary from "@/components/TextLibrary";

export default function LibraryPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <h1 className="text-3xl font-bold text-center mb-8">Bibliothèque Lisible</h1>
      <TextLibrary />
    </div>
  );
}