"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/router"; // Utilisez "next/navigation" si vous êtes dans le dossier /app
import { toast } from "sonner";

export default function PublishPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [authorName, setAuthorName] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageBase64 = null;
      if (imageFile) {
        imageBase64 = await toBase64(imageFile);
      }

      const res = await fetch("/api/texts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName,
          title,
          content,
          imageBase64
        })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erreur lors de l'envoi");

      toast.success("✅ Publié !");
      router.push("/bibliotheque");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Votre JSX reste identique...
  );
}
