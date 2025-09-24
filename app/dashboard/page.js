"use client";

import DashboardHeader from "@/components/DashboardHeader";
import AuthorStats from "@/components/AuthorStats";
import MonetizationLock from "@/components/MonetizationLock";
import PublishingForm from "@/components/PublishingForm";
import AuthorTextsList from "@/components/AuthorTextsList";

export default function DashboardPage() {
  const authorId = "author123"; // À remplacer par l'ID de l'utilisateur connecté

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <DashboardHeader />
      <AuthorStats authorId={authorId} />
      <MonetizationLock followers={230} /> {/* Simulé : à connecter à Firestore */}
      <PublishingForm authorId={authorId} />
      <AuthorTextsList authorId={authorId} />
    </div>
  );
}