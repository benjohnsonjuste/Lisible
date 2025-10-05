"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, storage, auth } from "@/lib/firebaseConfig";
import {
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
  doc,
  increment,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Input from "@/components/ui/Input";

export default function TextPublishing() {
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

  // 🔄 Charger le brouillon s’il existe
  useEffect(() => {
    const draft = localStorage.getItem("text_draft");
    if (draft) {
      setTextData(JSON.parse(draft));
    }
  }, []);

  // 🔢 Compteur de mots automatique
  useEffect(() => {
    const count = textData.content.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(count);
  }, [textData.content]);

  // 💾 Sauvegarde automatique toutes les 30 secondes
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      handleSaveDraft();
    }, 30000);
    return () => clearInterval(autoSaveInterval);
  }, [textData]);

  // 🧠 Fonction pour sauvegarder localement
  const handleSaveDraft = () => {
    try {
      localStorage.setItem("text_draft", JSON.stringify(textData));
      setSaveStatus("Brouillon sauvegardé ✔️");
    } catch (err) {
      console.error("Erreur de sauvegarde du brouillon :", err);
      setSaveStatus("Erreur de sauvegarde ❌");
    }
  };

  const handleChange = (field, value) => {
    setTextData((prev) => ({ ...prev, [field]: value }));
  };

  // 📤 Upload image de couverture vers Firebase Storage (Google Drive)
  const uploadCover = async () => {
    if (!coverFile) return "";
    const storageRef = ref(storage, `covers/${Date.now()}_${coverFile.name}`);
    await uploadBytes(storageRef, coverFile);
    return await getDownloadURL(storageRef);
  };

  // 🚀 Publier le texte sur Firestore
  const handlePublish = async (e) => {
    e.preventDefault();

    if (!auth.currentUser) {
      alert("Vous devez être connecté pour publier un texte.");
      return;
    }

    if (!textData.title.trim() || !textData.content.trim()) {
      alert("Veuillez saisir un titre et un contenu avant de publier.");
      return;
    }

    setIsPublishing(true);
    try {
      const coverUrl = await uploadCover();

      const newText = {
        ...textData,
        tags: textData.tags
          ? textData.tags.split(",").map((t) => t.trim())
          : [],
        coverUrl,
        authorId: auth.currentUser.uid,
        authorEmail: auth.currentUser.email,
        wordCount,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        visibility: "public",
      };

      await addDoc(collection(db, "texts"), newText);

      // 📈 Mise à jour automatique des métriques
      const authorRef = doc(db, "authors", auth.currentUser.uid);
      await updateDoc(authorRef, {
        publishedCount: increment(1),
        totalWords: increment(wordCount),
      });

      // 🧹 Nettoyer le brouillon
      localStorage.removeItem("text_draft");

      alert("Texte publié avec succès !");
      router.push("/author-dashboard/analytics");
    } catch (error) {
      console.error("Erreur de publication :", error);
      alert("Erreur lors de la publication. Réessayez.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-start py-10">
      <form
        onSubmit={handlePublish}
        className="bg-white shadow-md rounded-2xl p-8 w-full max-w-3xl space-y-6"
      >
        <h1 className="text-2xl font-bold text-center text-gray-800">
          Publier un texte sur Lisible
        </h1>

        <Input
          label="Titre du texte"
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
            Contenu du texte <span className="text-destructive">*</span>
          </label>
          <textarea
            required
            value={textData.content}
            onChange={(e) => handleChange("content", e.target.value)}
            placeholder="Écrivez votre texte ici..."
            className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
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
            {isPublishing ? "Publication..." : "Publier sur Lisible"}
          </button>
        </div>
      </form>
    </div>
  );
}