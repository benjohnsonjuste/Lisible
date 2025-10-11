"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { sendToSheets } from "@/lib/sendToSheets";

export default function TextPublishing({ onPublishSuccess }) {
  const router = useRouter();
  const { user } = useAuth();

  const [textData, setTextData] = useState({
    title: "",
    subtitle: "",
    category: "",
    tags: "",
    content: "",
  });

  const [isPublishing, setIsPublishing] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [saveStatus, setSaveStatus] = useState("");

  // 🔹 Charger brouillon local
  useEffect(() => {
    const draft = localStorage.getItem("text_draft");
    if (draft) setTextData(JSON.parse(draft));
  }, []);

  // 🔹 Compteur de mots
  useEffect(() => {
    setWordCount(
      textData.content.trim().split(/\s+/).filter(Boolean).length
    );
  }, [textData.content]);

  const handleSaveDraft = () => {
    try {
      localStorage.setItem("text_draft", JSON.stringify(textData));
      setSaveStatus("Brouillon sauvegardé ✔️");
      toast.success("Brouillon sauvegardé ✔️");
    } catch {
      setSaveStatus("Erreur de sauvegarde ❌");
      toast.error("Erreur de sauvegarde ❌");
    }
  };

  const handleChange = (field, value) =>
    setTextData((prev) => ({ ...prev, [field]: value }));

  const handlePublish = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("⚠️ Connectez-vous pour publier.");
      return;
    }

    if (!textData.title.trim() || !textData.content.trim()) {
      toast.error("⚠️ Le titre et le contenu sont obligatoires.");
      return;
    }

    setIsPublishing(true);
    try {
      const tagsArray = textData.tags
        ? textData.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
        : [];

      // 🔹 Envoyer directement à Google Sheets
      await sendToSheets({
        email: user.email,
        name: user.user_metadata?.display_name || "Auteur inconnu",
        title: textData.title,
        subtitle: textData.subtitle,
        category: textData.category,
        tags: tagsArray.join(", "),
        content: textData.content,
        action: "Publication Lisible",
        date: new Date().toISOString(),
      });

      localStorage.removeItem("text_draft");
      toast.success("✅ Texte publié et enregistré dans Google Sheets !");
      if (onPublishSuccess) onPublishSuccess();
      else router.push("/library");
    } catch (err) {
      console.error("Erreur publication Sheets :", err);
      toast.error("❌ Échec de l’enregistrement dans Sheets.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <form
      onSubmit={handlePublish}
      className="bg-white shadow-md rounded-2xl p-8 w-full max-w-3xl space-y-6"
    >
      <h1 className="text-2xl font-bold text-center text-primary">
        ✍️ Publier un texte sur Lisible
      </h1>

      <Input
        label="Titre"
        required
        value={textData.title}
        onChange={(e) => handleChange("title", e.target.value)}
      />

      <Input
        label="Sous-titre"
        value={textData.subtitle}
        onChange={(e) => handleChange("subtitle", e.target.value)}
      />

      <Input
        label="Catégorie"
        value={textData.category}
        onChange={(e) => handleChange("category", e.target.value)}
      />

      <Input
        label="Tags (séparés par des virgules)"
        value={textData.tags}
        onChange={(e) => handleChange("tags", e.target.value)}
      />

      <div>
        <label className="block text-sm font-medium text-primary mb-1">
          Contenu <span className="text-destructive">*</span>
        </label>
        <textarea
          required
          value={textData.content}
          onChange={(e) => handleChange("content", e.target.value)}
          placeholder="Écrivez votre texte ici..."
          className="w-full min-h-[220px] border border-input rounded-md px-3 py-2 text-sm"
        />
        <p className="text-xs text-muted mt-1">
          {wordCount} mots – {saveStatus}
        </p>
      </div>

      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={handleSaveDraft}
          className="px-4 py-2 rounded-md border border-primary text-primary hover:bg-primary/10 transition"
        >
          Sauvegarder le brouillon
        </button>
        <button
          type="submit"
          disabled={isPublishing}
          className="px-4 py-2 rounded-md bg-primary text-white font-semibold hover:bg-primary/90 transition disabled:opacity-50"
        >
          {isPublishing ? "Publication..." : "Publier"}
        </button>
      </div>
    </form>
  );
}