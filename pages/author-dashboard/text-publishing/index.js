"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import PublishingSidebar from "@/components/PublishingSidebar";
import TextEditor from "@/components/TextEditor";
import ImageUploader from "@/components/ImageUploader";
import ApercuModal from "@/components/ApercuModal";
import PublierConfirmationModal from "@/components/PublierConfirmationModal";

export default function TextPublishingPage() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [isApercuOpen, setIsApercuOpen] = useState(false);
  const [isPublierConfirmOpen, setIsPublierConfirmOpen] = useState(false);

  if (!user) {
    return <p className="p-6">Veuillez vous connecter pour publier un texte.</p>;
  }

  const handlePreview = () => {
    setIsApercuOpen(true);
  };

  const handlePublish = () => {
    setIsPublierConfirmOpen(true);
  };

  return (
    <div className="flex gap-6 p-6">
      {/* Sidebar */}
      <aside className="w-72">
        <PublishingSidebar
          title={title}
          excerpt={excerpt}
          coverFile={coverFile}
          onPublish={handlePublish}
          onPreview={handlePreview}
        />
      </aside>

      {/* Main content */}
      <main className="flex-1 space-y-6">
        <h1 className="text-2xl font-bold">Publier un texte</h1>

        {/* Titre et extrait */}
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Titre du texte"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-border rounded-lg p-2 bg-background"
          />
          <textarea
            placeholder="Courte description / extrait"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            className="w-full border border-border rounded-lg p-2 bg-background"
            rows={3}
          />
        </div>

        {/* Image uploader */}
        <ImageUploader file={coverFile} setFile={setCoverFile} />

        {/* Text editor */}
        <TextEditor content={content} setContent={setContent} />

        {/* Modals */}
        <ApercuModal
          isOpen={isApercuOpen}
          onClose={() => setIsApercuOpen(false)}
          title={title}
          excerpt={excerpt}
          content={content}
          coverFile={coverFile}
        />
        <PublierConfirmationModal
          isOpen={isPublierConfirmOpen}
          onClose={() => setIsPublierConfirmOpen(false)}
          title={title}
          excerpt={excerpt}
          content={content}
          coverFile={coverFile}
        />
      </main>
    </div>
  );
}