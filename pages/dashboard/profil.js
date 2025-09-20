import { useState } from "react";
import { useAuth } from "../../context/AuthContext"; // ou votre méthode d'auth

export default function Profil() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);

  const handleChange = (e) => setFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const fileBase64 = reader.result.split(",")[1];

      const res = await fetch("/api/uploadAvatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, fileBase64, code: "<OAUTH_CODE>" }),
      });

      const data = await res.json();
      alert("Avatar mis à jour !");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <h1>Profil</h1>
      <input type="file" accept="image/*" onChange={handleChange} />
      <button onClick={handleUpload}>Changer la photo</button>
    </div>
  );
}