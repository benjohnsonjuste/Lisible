"use client"; // si tu es en App Router

import { useRef } from "react";

export default function UploadButton() {
  const inputRef = useRef(null);

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
      alert(`Fichier uploadé : ${data.url}`);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          if (e.target.files[0]) handleUpload(e.target.files[0]);
        }}
      />
      <button
        onClick={() => inputRef.current.click()}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        Upload un fichier
      </button>
    </div>
  );
}