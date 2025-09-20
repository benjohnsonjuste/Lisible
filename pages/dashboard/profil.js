import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function ProfilePage() {
  const [avatar, setAvatar] = useState("/default-avatar.jpg");
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        if (user.photoURL) setAvatar(user.photoURL);
      }
    });
    return () => unsubscribe();
  }, []);

  function requestOAuthCode() {
    /* global google */
    const client = google.accounts.oauth2.initCodeClient({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      scope: "https://www.googleapis.com/auth/drive.file",
      ux_mode: "popup",
      callback: (response) => {
        if (response.code) {
          localStorage.setItem("oauthCode", response.code);
          alert("Autorisation réussie ! Sélectionnez une image.");
        }
      },
    });

    client.requestCode();
  }

  async function handleChooseFile(e) {
    const file = e.target.files[0];
    if (!file || !userId) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result.split(",")[1];
      await uploadToDrive(base64, file.name);
    };
    reader.readAsDataURL(file);
  }

  async function uploadToDrive(base64, fileName) {
    setLoading(true);
    try {
      const code = localStorage.getItem("oauthCode");
      if (!code) {
        alert("Veuillez autoriser Google Drive d'abord.");
        return;
      }

      const res = await fetch("/api/uploadAvatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, imageBase64: base64, fileName, userId }),
      });

      const data = await res.json();
      if (data.success) {
        setAvatar(data.url);
        alert("Photo mise à jour !");
      } else {
        alert("Erreur : " + data.error);
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
        style={{ width: 150, height: 150, borderRadius: "50%", objectFit: "cover" }}
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