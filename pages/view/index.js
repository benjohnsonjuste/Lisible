"use client";
import { useEffect, useState } from "react";
import UploadButton from "@/components/UploadButton";

export default function ViewPage() {
  const [files, setFiles] = useState([]);

  async function fetchFiles() {
    const res = await fetch("/api/upload");
    const data = await res.json();
    setFiles(data);
  }

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Gestion des fichiers Google Drive</h1>

      <UploadButton refreshFiles={fetchFiles} />

      <h2 className="text-xl mt-6 mb-2">📂 Fichiers déjà uploadés :</h2>
      <ul className="space-y-2">
        {files.map((file) => (
          <li key={file.id} className="p-2 border rounded">
            <a
              href={`https://drive.google.com/uc?id=${file.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              {file.name}
            </a>
            <span className="ml-2 text-gray-500 text-sm">({file.mimeType})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
