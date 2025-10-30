// pages/author-dashboard/text-publishing/index.js
"use client";

import TextPublishingForm from "@/components/TextPublishingForm";

export default function TextPublishingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold text-center mb-4">
          Publier un texte
        </h1>
        <TextPublishingForm />
      </div>
    </div>
  );
}