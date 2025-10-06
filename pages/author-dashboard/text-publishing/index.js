"use client";

import React from "react";
import TextPublishing from "@/components/TextPublishing";

export default function AuthorDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900">
        Tableau de bord
      </h1>

      <TextPublishing />
    </div>
  );
}