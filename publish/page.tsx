"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";

// --- 1️⃣ Configuration Firebase côté client ---
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default function Page() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [authorName, setAuthorName] = useState("AuteurTest");
  const [authorEmail, setAuthorEmail] = useState("");

  const toDataUrl = (file: File) =>
    new Promise<string>((res, rej) => {
      const reader = new FileReader();
      reader.onerror = () => rej(new Error("File read error"));
      reader.onload = () => res(reader.result as string);
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      return toast.error("Titre et contenu requis");
    }

    setLoading(true);
    try {
      // --- 2️⃣ Récupérer token Firebase ---
      const user = auth.currentUser;
      if (!user) throw new Error("Vous devez être connecté pour publier");
      const token = await user.getIdToken();

      let imageBase64: string | null = null;
      let imageName: string | null = null;
      if (imageFile) {
        imageBase64 = await toDataUrl(imageFile);
        imageName = imageFile.name;
      }

      // --- 3️⃣ Appel API publish-github ---
      const res = await fetch("/api/publish-github", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          content,
          authorName,
          authorEmail,
          imageBase64,
          imageName,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur publication");

      toast.success("Texte publié avec succès !");
      router.push(data.url.replace("https://github.com", "")); // ajuste selon ton besoin
    } catch (err: any) {
      console.error("publish error", err);
      toast.error(err.message || "Erreur publication");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Publier un texte</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          className="w-full border p-2 rounded"
          placeholder="Nom auteur"
        />
        <input
          value={authorEmail}
          onChange={(e) => setAuthorEmail(e.target.value)}
          className="w-full border p-2 rounded"
          placeholder="Email auteur (optionnel)"
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border p-2 rounded"
          placeholder="Titre"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          className="w-full border p-2 rounded"
          placeholder="Contenu"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        />
        <button
          disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded"
        >
          {loading ? "Publication..." : "Publier"}
        </button>
      </form>
    </div>
  );
}