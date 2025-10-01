"use client";
import { useState } from "react";
import { db } from "../firebase"; // Firebase config file (see setup instructions below)
import { addDoc, collection } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // For user authentication

async function handleUpload(file, setLoading, setUrl) {
  try {
    setLoading(true);

    const reader = new FileReader();

    reader.onloadend = async () => {
      try {
        const base64 = reader.result.split(",")[1];

        // Upload file to Google Drive via API route
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type,
            base64,
          }),
        });

        if (!res.ok) throw new Error("Erreur lors de l’upload");

        const data = await res.json();
        if (setUrl) setUrl(data.url);

        // Get the current user's ID (if authenticated)
        const auth = getAuth();
        const user = auth.currentUser;
        const authorId = user ? user.uid : "anonymous"; // Fallback to "anonymous" if no user is logged in

        // Save publication metadata to Firestore
        await addDoc(collection(db, "publications"), {
          url: data.url,
          fileName: file.name,
          mimeType: file.type,
          authorId,
          timestamp: new Date().toISOString(),
          // Add optional fields like title, description, etc., if needed
        });
      } catch (err) {
        console.error("❌ Upload échoué :", err);
        alert("Échec de l’upload !");
      } finally {
        setLoading(false);
      }
    };

    reader.readAsDataURL(file);
  } catch (err) {
    console.error("❌ Erreur handleUpload :", err);
    setLoading(false);
  }
}

export default function UploadForm() {
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleUpload(file, setLoading, setUrl);
  };

  return (
    <div className="p-4">
      <input type="file" onChange={onFileChange} disabled={loading} />

      {loading && <p className="text-blue-500">⏳ Upload en cours...</p>}
      {url && (
        <p className="text-green-600">
          ✅ Fichier disponible :{" "}
          <a href={url} target="_blank" className="underline">
            {url}
          </a>
        </p>
      )}
    </div>
  );
}