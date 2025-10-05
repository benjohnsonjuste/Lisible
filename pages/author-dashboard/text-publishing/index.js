"use client";

import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import Header from "@/components/ui/Header";
import Button from "@/components/ui/Button";
import TextEditor from "@/components/TextEditor";
import ImageUploader from "@/components/ImageUploader";
import PublishingSidebar from "@/components/PublishingSidebar";
import ApercuModal from "@/components/ApercuModal";
import PublierConfirmationModal from "@/components/PublierConfirmationModal";

const mockTexts = [
  {
    id: 1,
    title: "Les Murmures de Montmartre",
    subtitle: "Une histoire captivante dans les rues pavées de Montmartre",
    content: "<h1>Chapitre Premier</h1><p>Les premiers rayons du soleil...</p>",
    coverImage: "https://images.unsplash.com/photo-1502602898536-47ad22581b52?1=800&h=400",
    contentImages: [],
    visibility: "public",
    category: "fiction",
    tags: ["paris", "romance"],
    contentWarning: "",
  },
];

const TextPublishing = () => {
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  const textId = searchParams.get("id");

  const [textData, setTextData] = useState({
    title: "",
    subtitle: "",
    content: "",
    coverImage: "",
    contentImages: [],
  });

  const [publishingData, setPublishingData] = useState({
    visibility: "public",
    category: "fiction",
    tags: [],
    contentWarning: "",
  });

  const [wordCount, setWordCount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  // Charger le texte existant si textId
  useEffect(() => {
    const existingText = mockTexts.find(
      (text) => text.id === parseInt(textId)
    );
    if (existingText) {
      setTextData({
        title: existingText.title,
        subtitle: existingText.subtitle,
        content: existingText.content,
        coverImage: existingText.coverImage,
        contentImages: existingText.contentImages,
      });
      setPublishingData({
        visibility: existingText.visibility,
        category: existingText.category,
        tags: existingText.tags,
        contentWarning: existingText.contentWarning,
      });
    }
  }, [textId]);

  // Calcul du nombre de mots
  useEffect(() => {
    const tmp = document.createElement("div");
    tmp.innerHTML = textData.content || "";
    const text = tmp.textContent || tmp.innerText || "";
    const mots = text.trim().split(/\s+/);
    setWordCount(mots.length);
  }, [textData.content]);

  // Auto-save toutes les 30 secondes
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      handleSaveDraft();
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [textData, publishingData]);

  const handleTextDataChange = (field, value) => {
    setTextData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCoverImageChange = (image) => {
    setTextData((prev) => ({ ...prev, coverImage: image }));
  };

  const handleContentImagesChange = (images) => {
    setTextData((prev) => ({ ...prev, contentImages: images }));
  };

  const handleSaveDraft = async () => {
    setSaveStatus("saving");
    try {
      const draftData = {
        textData,
        publishingData,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(`draft_${textId || "new"}`, JSON.stringify(draftData));
      setSaveStatus("saved");
    } catch (err) {
      console.error("Erreur d'enregistrement du brouillon", err);
      setSaveStatus("error");
    }
  };

  const handlePreview = () => setShowPreview(true);
  const handlePublish = () => setShowPublishModal(true);

  const handleConfirmPublish = async () => {
    if (!textData.title?.trim()) {
      alert("Veuillez saisir un titre pour votre texte.");
      return;
    }
    if (!textData.content?.trim()) {
      alert("Veuillez saisir du contenu pour votre texte.");
      return;
    }
    setIsPublishing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // simulation API
      localStorage.removeItem(`draft_${textId || "new"}`);
      alert("Votre texte a été publié avec succès !");
      navigate("/auteur-tableau-de-bord");
    } catch (err) {
      console.error("Erreur publication du texte", err);
      alert("Une erreur est survenue lors de la publication. Veuillez réessayer.");
    } finally {
      setIsPublishing(false);
      setShowPublishModal(false);
    }
  };

  const handleBack = () => {
    if (textData.title || textData.content) {
      const confirmLeave = window.confirm(
        "Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter ?"
      );
      if (!confirmLeave) return;
    }
    navigate("/auteur-tableau-de-bord");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="pt-16 lg:flex">
        {/* Barre latérale mobile */}
        <div className={`lg:hidden p-4 border-b border-gray-200 flex justify-between`}>
          <Button variant="ghost" iconName="ArrowLeft" iconPosition="left" onClick={handleBack}>
            Retour
          </Button>
          <Button variant="outline" iconName="Settings" iconPosition="left" onClick={() => setShowMobileSidebar(true)}>
            Options
          </Button>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 p-6 lg:pr-0 max-w-4xl mx-auto space-y-6">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-gray-900">Nouveau texte</h1>
            <p className="text-sm text-gray-500">Créez et publiez votre contenu littéraire</p>

            {/* Titre et Sous-titre */}
            <input
              type="text"
              placeholder="Titre de votre texte"
              value={textData.title}
              onChange={(e) => handleTextDataChange("title", e.target.value)}
              className="text-2xl font-bold border-0 border-b-2 border-gray-300 focus:border-primary w-full py-3"
              maxLength={100}
            />
            <input
              type="text"
              placeholder="Sous-titre (facultatif)"
              value={textData.subtitle}
              onChange={(e) => handleTextDataChange("subtitle", e.target.value)}
              className="text-lg border-0 border-b-2 border-gray-300 focus:border-primary w-full py-2"
              maxLength={150}
            />

            {/* Image de couverture */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Image de couverture</h3>
              <ImageUploader
                images={textData.coverImage ? [textData.coverImage] : []}
                onImagesChange={(imgs) => handleCoverImageChange(imgs[0])}
                type="cover"
              />
            </div>

            {/* Éditeur de contenu */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Contenu</h3>
              <TextEditor
                content={textData.content}
                onChange={handleTextDataChange}
                onSave={handleSaveDraft}
                saveStatus={saveStatus}
                wordCount={wordCount}
              />
            </div>

            {/* Images de contenu */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Images du contenu</h3>
              <ImageUploader
                images={textData.contentImages}
                onImagesChange={handleContentImagesChange}
                type="content"
              />
            </div>
          </div>
        </div>

        {/* Barre latérale de publication */}
        <PublishingSidebar
          publishingData={publishingData}
          setPublishingData={setPublishingData}
          onSaveDraft={handleSaveDraft}
          onPreview={handlePreview}
          onPublish={handlePublish}
          isPublishing={isPublishing}
        />
      </div>

      {/* Aperçu */}
      <PreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        textData={textData}
        publishingData={publishingData}
      />

      {/* Confirmation de publication */}
      <PublierConfirmationModal
        open={showPublishModal}
        onConfirm={handleConfirmPublish}
        onClose={() => setShowPublishModal(false)}
        textData={textData}
        publishingData={publishingData}
      />
    </div>
  );
};

export default TextPublishing;