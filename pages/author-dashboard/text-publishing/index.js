"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import ImageUploader from "@/components/ImageUploader";
import ApercuModal from "@/components/ApercuModal";
import PublierConfirmationModal from "@/components/PublierConfirmationModal";
import PublishingSidebar from "@/components/PublishingSidebar";
import PublishingForm from
"@/components/PublishingForm";
import TextEditor from "@/components/TextEditor";
import { db, storage } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Button } from "@/components/ui/Button";

export default function TextPublishingPage() {
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [type, setType] = useState("Roman");
  const [coverFile, setCoverFile] = useState(null);
  const [content, setContent] = useState("");
  const [openPreview, setOpenPreview] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  if (!user) {
    return (
      <div className="py-12 text-center">
        <p>Veuillez vous connecter pour publier un texte.</p>
      </div>
    );
  }

  // 🔹 Envoi dans Firestore + upload image
  const handlePublish = async () => {
    setLoading(true);
    setMessage("");

    try {
      let coverUrl = "";
      if (coverFile) {
        const storageRef = ref(storage, `covers/${user.uid}/${coverFile.name}`);
        await uploadBytes(storageRef, coverFile);
        coverUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, "texts"), {
        title,
        type,
        content,
        authorId: user.uid,
        authorEmail: user.email,
        coverUrl,
        createdAt: serverTimestamp(),
        status: "published",
        views: 0,
        likes: 0,
      });

      setMessage("✅ Texte publié avec succès !");
      setOpenConfirm(false);
      setTitle("");
      setContent("");
      setCoverFile(null);
    } catch (err) {
      console.error("Erreur de publication :", err);
      setMessage("❌ Échec de la publication. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 p-6">
      {/* 🧭 Barre latérale */}
      <aside className="md:w-72">
        <PublishingSidebar
          title={title}
          setTitle={setTitle}
          type={type}
          setType={setType}
          onPreview={() => setOpenPreview(true)}
          onPublish={() => setOpenConfirm(true)}
        />
      </aside>

      {/* ✍️ Zone principale */}
      <main className="flex-1 space-y-6">
        <h1 className="text-2xl font-semibold">Publier un texte</h1>

        {/* Upload image */}
        <ImageUploader onFileSelect={setCoverFile} />

        {/* Éditeur de texte */}
        <TextEditor value={content} onChange={setContent} />

        {/* Boutons */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpenPreview(true)}>
            Aperçu
          </Button>
          <Button onClick={() => setOpenConfirm(true)} disabled={loading}>
            {loading ? "Publication..." : "Publier"}
          </Button>
        </div>

        {message && (
          <p className="text-center text-sm text-muted-foreground mt-3">{message}</p>
        )}
      </main>

      {/* 🪞 Aperçu */}
      <ApercuModal
        open={openPreview}
        onClose={() => setOpenPreview(false)}
        title={title}
        content={content}
        type={type}
        coverFile={coverFile}
      />

      {/* ✅ Confirmation */}
      <PublierConfirmationModal
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        onConfirm={handlePublish}
        loading={loading}
      />
    </div>
  );
} 