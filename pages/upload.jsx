import { useState } from "react";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!file) return alert("Sélectionne un fichier");

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Data = reader.result.split(",")[1];

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileName: file.name, fileData: base64Data }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`Upload réussi ! Fichier ID: ${data.file.id}`);
      } else {
        setMessage(`Erreur: ${data.error}`);
      }
    };
  };

  return (
    <div>
      <h1>Upload vers Google Drive</h1>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Uploader</button>
      <p>{message}</p>
    </div>
  );
}
