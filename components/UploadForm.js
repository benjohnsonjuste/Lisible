"use client";
import { useState } from "react";

async function handleUpload(file, setLoading, setUrl) {
  try {
    setLoading(true);

    const reader = new FileReader();

    reader.onloadend = async () => {
      try {
        const base64 = reader.result.split(",")[1];

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
      <input type="file" onChange={onFileChange} />

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
