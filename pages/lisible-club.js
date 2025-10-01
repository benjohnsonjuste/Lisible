"use client";

import PublishPost from "@/components/PublishPost";
import AllPostsViewer from "@/components/AllPostsViewer";

export default function LisibleClub() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-center mb-4">Lisible Club</h1>

      {/* Composant pour publier */}
      <PublishPost />

      {/* Composant pour afficher toutes les publications */}
      <AllPostsViewer />
    </div>
  );
}