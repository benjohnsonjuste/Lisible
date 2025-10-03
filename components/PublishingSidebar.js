// components/PublishingSide.js
import React, { useState } from "react";
import Bouton from "@/components/ui/Bouton";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";

const PublishingSide = ({
  publicationData = {},
  onSaveDraft,
  onPreview,
  onPublier,
  isPublishing = false,
}) => {
  const [titre, setTitre] = useState(publicationData.titre || "");
  const [contenu, setContenu] = useState(publicationData.contenu || "");
  const [categorie, setCategorie] = useState(publicationData.categorie || "");
  const [visibilite, setVisibilite] = useState(publicationData.visibilite || "public");
  const [scheduled, setScheduled] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const categoryOptions = [
    { value: "fiction", label: "Fiction" },
    { value: "non-fiction", label: "Non-fiction" },
    { value: "poésie", label: "Poésie" },
    { value: "essai", label: "Essai" },
    { value: "biographie", label: "Biographie" },
    { value: "romance", label: "Romance" },
    { value: "mystère", label: "Mystère" },
    { value: "science-fiction", label: "Science-fiction" },
    { value: "fantaisie", label: "Fantastique" },
    { value: "historique", label: "Historique" },
    { value: "thriller", label: "Thriller" },
    { value: "drame", label: "Drame" },
  ];

  const visibilityOptions = [
    { value: "public", label: "Public" },
    { value: "abonnés", label: "Abonnés uniquement" },
    { value: "privé", label: "Privé" },
  ];

  return (
    <div className="p-6 bg-card rounded-lg shadow space-y-4">
      <h2 className="text-xl font-bold">Nouvelle Publication</h2>

      <Input
        label="Titre"
        value={titre}
        onChange={(e) => setTitre(e.target.value)}
      />

      <Input
        label="Contenu"
        value={contenu}
        onChange={(e) => setContenu(e.target.value)}
        textarea
        rows={6}
      />

      <Select
        label="Catégorie"
        value={categorie}
        onChange={setCategorie}
        options={categoryOptions}
      />

      <Select
        label="Visibilité"
        value={visibilite}
        onChange={setVisibilite}
        options={visibilityOptions}
      />

      <div className="flex items-center space-x-2">
        <Checkbox
          checked={scheduled}
          onChange={() => setScheduled(!scheduled)}
        />
        <span className="text-sm text-gray-600">Programmer la publication</span>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          checked={agreedToTerms}
          onChange={() => setAgreedToTerms(!agreedToTerms)}
        />
        <span className="text-sm text-gray-600">J’accepte les conditions de monétisation</span>
      </div>

      <div className="flex space-x-2 justify-end">
        <Bouton onClick={() => onSaveDraft({ titre, contenu, categorie, visibilite, scheduled })}>
          Enregistrer en brouillon
        </Bouton>
        <Bouton onClick={() => onPreview({ titre, contenu, categorie, visibilite })}>
          Aperçu
        </Bouton>
        <Bouton
          onClick={() => agreedToTerms && onPublier({ titre, contenu, categorie, visibilite, scheduled })}
          disabled={!agreedToTerms || isPublishing}
          className={`${agreedToTerms ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300"} text-white`}
        >
          {isPublishing ? "Publication..." : "Publier"}
        </Bouton>
      </div>
    </div>
  );
};

export default PublishingSide;
