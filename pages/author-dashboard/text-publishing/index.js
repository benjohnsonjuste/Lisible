// pages/author-dashboard/text-publishing/index.js
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";

import Header from "@/components/ui/Header";
import Bouton from "@/components/ui/Bouton";
import TextEditor from "@/components/TextEditor";
import ImageUploader from "@/components/ImageUploader";
import PublishingSidebar from "@/components/PublishingSidebar";
import ApercuModal from "@/components/ApercuModal";
import PublishConfirmationModal from "@/components/PublishConfirmationModal";

const TextPublishing = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const textId = searchParams.get("id");

  // État du contenu et des images
  const [textData, setTextData] = useState({
    contenu: "",
    sousTitre: "",
    contenuImages: [],
    public: true,
    categories: [],
    balises: [],
    metaDescription: "",
    commentairesAutorises: true,
    datePrevue: null,
    heurePrevue: null,
  });

  const [publishingData, setPublishingData] = useState({
    status: "draft", // draft, published
    visibility: "public",
  });

  const [wordCount, setWordCount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  // Compter le nombre de mots à chaque changement de contenu
  useEffect(() => {
    const countWords = textData.contenu?.trim().split(/\s+/).length || 0;
    setWordCount(countWords);
  }, [textData.contenu]);

  // Sauvegarder le brouillon
  const handleSaveDraft = (contenu) => {
    setTextData((prev) => ({ ...prev, contenu }));
    setSaveStatus("Enregistré");
    setTimeout(() => setSaveStatus(""), 2000);
  };

  // Publication
  const handlePublish = () => {
    setShowConfirmation(true);
  };

  return (
    <div className="p-6 space-y-6">
      <Header titre="Publication de texte" />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Éditeur principal */}
        <div className="flex-1 space-y-4">
          <TextEditor
            contenu={textData.contenu}
            onChange={(html) => setTextData((prev) => ({ ...prev, contenu: html }))}
            onSave={handleSaveDraft}
            saveStatus={saveStatus}
          />

          <ImageUploader
            images={textData.contenuImages}
            onChange={(images) => setTextData((prev) => ({ ...prev, contenuImages: images }))}
          />

          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-500">{wordCount} mots</span>
            <Bouton onClick={() => setShowPreview(true)}>Aperçu</Bouton>
            <Bouton onClick={handlePublish}>Publier</Bouton>
          </div>
        </div>

        {/* Sidebar Publishing */}
        <PublishingSidebar
          data={publishingData}
          onChange={(updates) => setPublishingData((prev) => ({ ...prev, ...updates }))}
          onSaveMetadata={(meta) => setTextData((prev) => ({ ...prev, ...meta }))}
        />
      </div>

      {/* Modales */}
      {showPreview && (
        <PreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          textData={textData}
        />
      )}

      {showConfirmation && (
        <PublishConfirmationModal
          isOpen={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          onConfirm={() => {
            setPublishingData((prev) => ({ ...prev, status: "published" }));
            setShowConfirmation(false);
            navigate("/author-dashboard"); // Redirection après publication
          }}
          textData={textData}
        />
      )}
    </div>
  );
};

export default TextPublishing;
