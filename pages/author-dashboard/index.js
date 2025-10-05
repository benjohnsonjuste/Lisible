// pages/author-dashboard/index.js
"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import QuickActions from "@/components/QuickActions";
import TextPublishingForm from
"@/components/TextPublishingForm";
import ContentLibrary from "@/components/ContentLibrary";

export default function AuthorDashboard() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="py-12">
        <p className="text-center">Veuillez vous connecter pour accéder au tableau de bord.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <QuickActions />
      <TextPublishingForm />
      <ContentLibrary />
      {/* ajoute d'autres sections du dashboard ici */}
    </div>
  );
}