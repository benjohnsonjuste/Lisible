// components/account-management/ProfileSection.jsx
import React, { useState } from "react";
import Bouton from "@/components/ui/Bouton";
import Input from "@/components/ui/Input";
import AppIcon from "@/components/AppIcon";
import AppImage from "@/components/AppImage";

const ProfileSection = ({ profileData, onProfileUpdate }) => {
  const [formData, setFormData] = useState({
    displayName: profileData?.displayName || "",
    bio: profileData?.bio || "",
    email: profileData?.email || "",
    website: profileData?.website || "",
    description: profileData?.description || "",
  });

  const [profileImage, setProfileImage] = useState(profileData?.profileImage || null);
  const [imagePreview, setImagePreview] = useState(profileData?.profileImage || null);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleImageUpload = (e) => {
    const file = e?.target?.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsUploading(true);
    setErrors({});
    try {
      // Simulation d'appel API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onProfileUpdate({ ...formData, profileImage });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil", error);
      setErrors({ global: "Impossible de mettre à jour le profil." });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 bg-blue-50 rounded-lg space-y-6">
      <h2 className="text-xl font-bold text-blue-700 mb-4">Profil de l'auteur</h2>

      <div className="flex items-center space-x-4">
        <AppImage
          src={imagePreview || "/default-avatar.png"}
          alt="Photo de profil"
          className="w-24 h-24 rounded-full object-cover"
        />
        <Bouton variante="secondary">
          <label className="cursor-pointer">
            Changer la photo
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        </Bouton>
      </div>

      <Input
        label="Nom affiché"
        name="displayName"
        value={formData.displayName}
        onChange={handleInputChange}
      />

      <Input
        label="Bio"
        name="bio"
        value={formData.bio}
        onChange={handleInputChange}
        textarea
      />

      <Input
        label="Email"
        name="email"
        value={formData.email}
        onChange={handleInputChange}
      />

      <Input
        label="Site Web"
        name="website"
        value={formData.website}
        onChange={handleInputChange}
      />

      <Input
        label="Description"
        name="description"
        value={formData.description}
        onChange={handleInputChange}
        textarea
      />

      {errors.global && <p className="text-red-600 text-sm">{errors.global}</p>}

      <div className="flex justify-end mt-4">
        <Bouton variante="primary" onClick={handleSave} disabled={isUploading}>
          {isUploading ? "Enregistrement..." : "Enregistrer"}
        </Bouton>
      </div>
    </div>
  );
};

export default ProfileSection;