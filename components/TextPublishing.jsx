"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Input from "@/components/ui/Input";

export default function TextPublishing({ onPublishSuccess }) {
  const router = useRouter();

  const [textData, setTextData] = useState({
    title: "",
    subtitle: "",
    category: "",
    tags: "",
    content: "",
  });

  const [coverFile, setCoverFile] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [saveStatus, setSaveStatus] = useState("");

  // 🔹 Charger brouillon local
  useEffect(() => {
    const draft = localStorage.getItem("text_draft");
    if (draft) setTextData(JSON.parse(draft));
  }, []);

  // 🔹 Compteur de mots dynamique
  useEffect(() => {
    setWordCount(textData.content.trim().split(/\s+/).filter(Boolean).length);
  }, [textData.content]);

  // 🔹 Sauvegarde automatique toutes les 30s
  useEffect(() => {
    const interval = setInterval(() => handleSaveDraft(), 30000);
    return () => clearInterval(interval);
  }, [textData]);

  const handleSaveDraft = () => {
    try {
      localStorage.setItem("text_draft", JSON.stringify(textData));
      setSaveStatus("Brouillon sauvegardé ✔️");
    } catch {
      setSaveStatus("Erreur de sauvegarde ❌");
    }
  };

  const handleChange = (field, value) => {
    setTextData((prev) => ({ ...prev, [field]: value }));
  };

  // 🔹 Upload image dans le bucket "covers"
  const uploadCover = async () => {
    if (!coverFile) return null;

    const fileExt = coverFile.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("covers")
      .upload(fileName, coverFile);

    if (uploadError) {
      console.error("Erreur upload image :", uploadError.message);
      alert("❌ Échec du téléversement de la couverture.");
      return null;
    }

    const { data: publicData } = supabase.storage.from("covers").getPublicUrl(fileName);
    return publicData?.publicUrl || null;
  };

  // 🔹 Publier le texte
  const handlePublish = async (e) => {
    e.preventDefault();

    setIsPublishing(true);
    try {
      // Récupérer utilisateur Supabase
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      const user = session?.user;
      if (!user) return alert("⚠️ Connectez-vous pour publier.");

      if (!textData.title.trim() || !textData.content.trim()) {
        return alert("⚠️ Le titre et le contenu sont obligatoires.");
      }

      // Upload couverture
      const coverUrl = await uploadCover();

      // Insérer texte
      const { error: insertError } = await supabase.from("texts").insert([
        {
          title: textData.title,
          subtitle: textData.subtitle,
          category: textData.category,
          tags: textData.tags ? textData.tags.split(",").map((t) => t.trim().toLowerCase()) : [],
          content: textData.content,
          cover_url: coverUrl,
          author_id: user.id,
          author_email: user.email,
          views: 0,
          likes: 0,
          visibility: "public",
          created_at: new Date().toISOString(),
        },
      ]);

      if (insertError) throw insertError;

      // Supprime brouillon
      localStorage.removeItem("text_draft");

      alert("✅ Texte publié avec succès !");
      if (onPublishSuccess) onPublishSuccess();
      else router.push("/library");
    } catch (err) {
      console.error("Erreur publication :", err);
      alert("❌ Échec de la publication. Vérifiez la console.");
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

      <div>
        <label className="block text-sm font-medium text-primary mb-1">
          Image de couverture
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setCoverFile(e.target.files[0])}
          className="w-full text-sm text-muted"
        />
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