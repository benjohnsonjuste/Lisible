"use client";

import React from "react";
import TextLibrary from "@/components/TextLibrary";

export default function library() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">
        Tous les textes publiés
      </h1>

      <TextLibrary />
    </div>
  );
}