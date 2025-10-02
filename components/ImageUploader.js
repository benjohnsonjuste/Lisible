// components/ImageUploader.js
import React, { useState, useRef } from "react";
import AppIcon from "@/components/AppIcon";
import Bouton from "@/components/ui/Bouton";
import Input from "@/components/ui/Input";
import AppImage from "@/components/AppImage";

const ImageUploader = ({ onUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Gestion du drag & drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  // Fichiers déposés
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Sélection via input
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  // Gestion des fichiers
  const handleFiles = (files) => {
    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );
    if (imageFiles.length === 0) return;

    const file = imageFiles[0];
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target.result);
    reader.readAsDataURL(file);

    // Simuler le téléchargement pour l’exemple
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) clearInterval(interval);
    }, 100);

    // Callback pour l’envoi réel
    if (onUpload) onUpload(file);
  };

  return (
    <div
      className={`border-dashed border-2 p-4 rounded-lg text-center ${
        dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
      }`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      <p className="mb-2">Glissez-déposez votre image ici ou cliquez pour sélectionner</p>

      <Bouton onClick={() => fileInputRef.current.click()}>
        <AppIcon name="Upload" className="mr-2" />
        Choisir un fichier
      </Bouton>

      <Input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileSelect}
      />

      {previewUrl && (
        <div className="mt-4">
          <p className="text-sm text-gray-500 mb-1">Aperçu :</p>
          <AppImage src={previewUrl} alt="Preview" className="max-h-48 mx-auto rounded" />
          <div className="h-2 bg-gray-200 rounded mt-2">
            <div
              className="h-2 bg-blue-500 rounded"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;