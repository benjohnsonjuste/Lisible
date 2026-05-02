"use client";

import React, { useState, useEffect } from "react";
import AdSocialBar from "@/components/AdSocialBar";
import FloatingActions from "@/components/reader/FloatingActions";
import SecurityLock from "@/components/SecurityLock";
import ReportModal from "@/components/ReportModal";
import SceauCertification from "@/components/reader/SceauCertification";
import CommentSection from "@/components/reader/CommentSection";
import SocialMargins from "@/components/reader/SocialMargins";

const TextContent = ({ id }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isReportModalOpen, setReportModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const baseUrl = "https://lisible.biz";
        const res = await fetch(`${baseUrl}/api/github-db?type=text&id=${id}`);
        if (res.ok) {
          const result = await res.json();
          setData(result.content);
        }
      } catch (error) {
        console.error("Erreur lors du chargement du texte:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return <div className="flex justify-center p-10">Chargement du manuscrit...</div>;
  if (!data) return <div className="flex justify-center p-10">Texte introuvable.</div>;

  return (
    <div className="relative min-h-screen bg-white">
      {/* Barre sociale latérale ou intégrée selon le design */}
      <SocialMargins />
      <AdSocialBar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* En-tête du texte */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-serif font-bold mb-4">{data.title}</h1>
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <span>Par {data.authorName}</span>
            {data.isCertified && <SceauCertification />}
          </div>
        </header>

        {/* Protection du contenu */}
        <SecurityLock>
          <article 
            className="prose prose-lg max-w-none font-serif leading-relaxed"
            dangerouslySetInnerHTML={{ __html: data.body || data.text }} 
          />
        </SecurityLock>

        {/* Section de fin d'article */}
        <footer className="mt-12 border-t pt-8">
          <CommentSection textId={id} />
        </footer>
      </main>

      {/* Actions flottantes (Partage, Scroll to top, etc.) */}
      <FloatingActions 
        onReport={() => setReportModalOpen(true)} 
        title={data.title}
      />

      {/* Modale de signalement */}
      <ReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setReportModalOpen(false)} 
        contentId={id}
      />
    </div>
  );
};

export default TextContent;
