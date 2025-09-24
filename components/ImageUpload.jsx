"use client";
import { useState } from "react";
import { storage } from "@/firebase/firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function ImageUpload({ onUploaded }) {
  const [loading, setLoading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    const storageRef = ref(storage, `posts/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    setLoading(false);
    onUploaded(url);
  };

  return (
    <div className="mb-3">
      <input type="file" accept="image/*" onChange={handleFile} />
      {loading && <div className="text-sm text-gray-500">Uploading...</div>}
    </div>
  );
}
