"use client";
import React from "react";

async function handleUpload(file) {
  const reader = new FileReader();
  reader.onloadend = async () => {
    const base64 = reader.result.split(",")[1]; // enlever le préfixe

    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type,
        base64,
      }),
    });

    const data = await res.json();
    console.log("✅ URL publique :", data.url);
    alert("Fichier uploadé : " + data.url);
  };
  reader.readAsDataURL(file);
}

export default function UploadButton() {
  return (
    <div className="p-4 border rounded">
      <input
        type="file"
        onChange={(e) => {
          if (e.target.files[0]) handleUpload(e.target.files[0]);
        }}
      />
    </div>
  );
}
