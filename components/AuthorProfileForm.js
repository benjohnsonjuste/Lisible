import { useState, useEffect } from "react";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function AuthorProfileForm({ authorId }) {
  const [profileImage, setProfileImage] = useState(null);
  const [bio, setBio] = useState("");
  const [newImage, setNewImage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authorId) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const ref = doc(db, "auteurs", authorId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setProfileImage(snap.data().photoURL || null);
          setBio(snap.data().bio || "");
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [authorId]);

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setNewImage(e.target.files[0]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let photoURL = profileImage;

      // 1. Uploader sur Google Drive si une nouvelle photo est choisie
      if (newImage) {
        const formData = new FormData();
        formData.append("file", newImage);
        formData.append("authorId", authorId);

        const res = await fetch("/api/uploadProfileImage", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Erreur upload");

        photoURL = data.url;
      }

      // 2. Mettre à jour Firestore
      await setDoc(
        doc(db, "auteurs", authorId),
        {
          photoURL,
          bio: bio.trim(),
          updatedAt: new Date(),
        },
        { merge: true }
      );

      setProfileImage(photoURL);
      setNewImage(null);
      alert("Profil mis à jour avec succès !");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour du profil.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <form
      onSubmit={handleSave}
      className="bg-white shadow-md rounded-2xl p-4 max-w-lg mx-auto space-y-4"
    >
      <h2 className="text-xl font-semibold text-center">Mon profil</h2>

      {/* Photo de profil */}
      <div className="flex flex-col items-center space-y-2">
        <img
          src={newImage ? URL.createObjectURL(newImage) : profileImage || "/default-profile.png"}
          alt="Photo de profil"
          className="w-24 h-24 rounded-full object-cover border"
        />
        <input type="file" accept="image/*" onChange={handleImageChange} />
      </div>

      {/* Bio */}
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        placeholder="Parlez un peu de vous..."
        className="w-full border p-2 rounded-md h-24"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full p-2 bg-blue-600 text-white rounded-md"
      >
        {loading ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}