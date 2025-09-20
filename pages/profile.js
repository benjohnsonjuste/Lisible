// pages/profile.js
import React, { useState } from "react";

export default function ProfilePage() {
  const [avatar, setAvatar] = useState("/default-avatar.jpg"); // image par défaut
  const [loading, setLoading] = useState(false);

  async function handleChooseFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Convertir en base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result.split(",")[1];
      await uploadToDrive(base64, file.name);
    };
    reader.readAsDataURL(file);
  }

  function requestOAuthCode() {
    /* global google */
    const client = google.accounts.oauth2.initCodeClient({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      scope: "https://www.googleapis.com/auth/drive.file",
      ux_mode: "popup",
      callback: async (response) => {
        if (response.code) {
          localStorage.setItem("oauthCode", response.code);
          alert("Autorisation réussie ! Choisis ton image maintenant.");
        }
      },
    });

    client.requestCode();
  }

  async function uploadToDrive(base64, fileName) {
    setLoading(true);
    try {
      const code = localStorage.getItem("oauthCode");
      if (!code) {
        alert("Veuillez autoriser Google avant de téléverser.");
        return;
      }

      const res = await fetch("/api/uploadAvatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, imageBase64: base64, fileName }),
      });

      const data = await res.json();
      if (data.success) {
        setAvatar(data.url);
      } else {
        alert("Échec de l'upload : " + data.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ textAlign: "center", marginTop: 40 }}>
      <h1>Mon Profil</h1>
      <img
        src={avatar}
        alt="Avatar"
        style={{ width: 150, height: 150, borderRadius: "50%" }}
      />
      <div style={{ marginTop: 20 }}>
        <button onClick={requestOAuthCode}>Autoriser Google Drive</button>
        <br />
        <input type="file" accept="image/*" onChange={handleChooseFile} />
      </div>
      {loading && <p>Chargement...</p>}
    </div>
  );
}