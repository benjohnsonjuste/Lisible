// components/ApercuModal.js
import React, { useState } from "react";
import AppIcon from "@/components/AppIcon";
import Button from "@/components/ui/Button";
import AppImage from "@/components/AppImage";

const ApercuModal = ({ isOpen, onClose, content, title, imageUrl }) => {
  const [viewMode, setViewMode] = useState("desktop"); // pour switch desktop/mobile preview si besoin

  if (!isOpen) return null;

  // Supprimer les balises HTML pour texte brut
  const stripHtmlTags = (html) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  // Estimation du temps de lecture
  const estimationLectureTime = (texte) => {
    const motsParMinute = 200;
    const mots = stripHtmlTags(texte).split(/\s+/).length;
    return Math.ceil(mots / motsParMinute);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full p-6 relative">
        {/* Bouton fermer */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          <AppIcon name="X" size={20} />
        </button>

        {/* Titre */}
        {title && <h2 className="text-xl font-bold mb-4">{title}</h2>}

        {/* Contenu */}
        {imageUrl && (
          <AppImage
            src={imageUrl}
            alt="Preview"
            className="w-full max-h-80 object-contain rounded mb-4"
          />
        )}

        {content && (
          <div className="text-gray-700 mb-4">
            <p>{stripHtmlTags(content)}</p>
            <p className="text-sm text-gray-400 mt-2">
              ⏱ Temps de lecture estimé : {estimationLectureTime(content)} min
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-2">
          <Button onClick={onClose} className="bg-gray-300 hover:bg-gray-400">
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ApercuModal;