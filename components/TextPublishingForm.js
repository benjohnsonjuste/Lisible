// components/TextPublishingForm.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import useUserProfile from "@/hooks/useUserProfile";

export default function TextPublishingForm() {
  const router = useRouter();
  const { user, isLoading: userLoading } = useUserProfile();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState(null);

  /** Convert image to Base64 (data URL) */
  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  async function handleSubmit(e) {
    e.preventDefault();

    if (userLoading) {
      toast("Vérification de votre session…", { type: "info" });
      return;
    }

    if (!user) {
      toast("Vous devez être connecté pour publier.", { type: "error" });
      return;
    }

    if (!title.trim() || !content.trim()) {
      toast("Veuillez écrire un titre et un contenu.", { type: "error" });
      return;
    }

    setLoading(true);
    setPublishedUrl(null);

    try {
      let imageBase64 = null;
      let imageName = null;

      if (imageFile) {
        if (!imageFile.type.startsWith("image/")) {
          toast("Le fichier doit être une image.", { type: "error" });
          setLoading(false);
          return;
        }

        // size limit: 2 MB
        const MAX_BYTES = 2 * 1024 * 1024;
        if (imageFile.size > MAX_BYTES) {
          toast("Image trop lourde. Max 2 Mo.", { type: "error" });
          setLoading(false);
          return;
        }

        imageBase64 = await toBase64(imageFile); // data URL
        imageName = Date.now() + "-" + imageFile.name.replace(/\s+/g, "_");
      }

      const authorName =
        (user && (user.fullName || user.displayName || user.name)) || "Auteur inconnu";

      const payload = {
        title: title.trim(),
        content: content.trim(),
        authorName,
        authorEmail: user?.email || "",
        imageBase64,
        imageName,
        createdAt: new Date().toISOString(),
      };

      const res = await fetch("/api/publish-github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        console.error("Erreur publication GitHub:", json);
        throw new Error(json.error || "Échec publication");
      }

      toast("Texte publié avec succès !", { type: "success" });
      setPublishedUrl(json.url);

      setTitle("");
      setContent("");
      setImageFile(null);
      setPreview(null);

      // Optionnel : redirect vers la page publiée (laisser le toast visible)
      // router.push(json.url);
    } catch (err) {
      console.error("Erreur:", err);
      toast("Échec lors de la publication.", { type: "error" });
    } finally {
      setLoading(false);
    }
  }

  function handleImage(e) {
    const f = e.target.files[0];
    if (!f) {
      setImageFile(null);
      setPreview(null);
      return;
    }
    setImageFile(f);
    setPreview(URL.createObjectURL(f));
  }

  if (userLoading)
    return <p className="text-center mt-10">Chargement de la session...</p>;

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow space-y-4"
    >
      <h2 className="text-xl font-semibold text-center">Publier un texte</h2>

      <div>
        <label className="block text-sm font-medium mb-1">Titre</label>
        <input
          type="text"
          placeholder="Titre du texte"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Contenu</label>
        <textarea
          placeholder="Écris ton texte..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={15}
          className="w-full p-2 border rounded min-h-[200px]"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Image d’illustration (optionnel)
        </label>
        <input type="file" accept="image/*" onChange={handleImage} />
        {preview && (
          <img
            src={preview}
            className="mt-3 w-full max-h-72 object-cover rounded"
            alt="Preview"
          />
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        {loading ? "Publication…" : "Publier"}
      </button>

      {publishedUrl && (
        <div className="mt-4 text-center">
          <p className="text-green-600">
            Votre texte est publié :{" "}
            <a href={publishedUrl} target="_blank" rel="noopener noreferrer" className="underline">
              Voir ce texte
            </a>
          </p>
        </div>
      )}
    </form>
  );
}