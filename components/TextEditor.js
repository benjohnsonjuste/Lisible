// components/TextEditor.js
import React, { useState, useEffect, useRef } from "react";
import Button from "@/components/ui/Button";
import { Heart, PenTool, AlignLeft, AlignCenter, AlignRight, List, ListOrdered } from "@/components/AppIcon";

const formatOptions = [
  { nom: "gras", commande: "bold", icone: PenTool },
  { nom: "italique", commande: "italic", icone: PenTool },
  { nom: "souligner", commande: "underline", icone: PenTool },
  { nom: "heading1", commande: "formatBlock", valeur: "H1", icone: PenTool },
  { nom: "heading2", commande: "formatBlock", valeur: "H2", icone: PenTool },
  { nom: "heading3", commande: "formatBlock", valeur: "H3", icone: PenTool },
  { nom: "alignLeft", commande: "justifyLeft", icone: AlignLeft },
  { nom: "alignCenter", commande: "justifyCenter", icone: AlignCenter },
  { nom: "alignRight", commande: "justifyRight", icone: AlignRight },
  { nom: "liste", commande: "insertUnorderedList", icone: List },
  { nom: "listeOrdonnée", commande: "insertOrderedList", icone: ListOrdered },
];

const TextEditor = ({ contenu = "", onChange, onSave, saveStatus }) => {
  const editorRef = useRef(null);
  const [selectedText, setSelectedText] = useState("");
  const [showFormatBar, setShowFormatBar] = useState(false);
  const [formatBarPosition, setFormatBarPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        setSelectedText(selection.toString());
        const rect = range.getBoundingClientRect();
        setFormatBarPosition({ top: rect.top - 40, left: rect.left });
        setShowFormatBar(selection.toString().length > 0);
      } else {
        setShowFormatBar(false);
      }
    };

    document.addEventListener("selectionchange", handleSelection);
    return () => document.removeEventListener("selectionchange", handleSelection);
  }, []);

  const applyFormat = (option) => {
    if (option.commande === "formatBlock" && option.valeur) {
      document.execCommand(option.commande, false, option.valeur);
    } else {
      document.execCommand(option.commande, false, null);
    }
    onChange(editorRef.current.innerHTML);
  };

  return (
    <div className="relative">
      {showFormatBar && (
        <div
          className="absolute flex space-x-2 bg-gray-100 p-2 rounded shadow z-50"
          style={{ top: formatBarPosition.top, left: formatBarPosition.left }}
        >
          {formatOptions.map((opt) => {
            const Icon = opt.icone;
            return (
              <button
                key={opt.nom}
                onMouseDown={(e) => {
                  e.preventDefault();
                  applyFormat(opt);
                }}
                className="p-1 hover:bg-gray-200 rounded"
                title={opt.nom}
              >
                <Icon size={16} />
              </button>
            );
          })}
        </div>
      )}

      <div
        ref={editorRef}
        className="border p-4 rounded min-h-[200px] focus:outline-none"
        contentEditable
        dangerouslySetInnerHTML={{ __html: contenu }}
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
      />

      <div className="mt-2 flex justify-end space-x-2">
        <Bouton onClick={() => onSave(editorRef.current.innerHTML)}>
          Sauvegarder
        </Bouton>
        {saveStatus && <span className="text-sm text-gray-500">{saveStatus}</span>}
      </div>
    </div>
  );
};

export default TextEditor;