// components/PublishingForm.jsx
"use client";
import { useState } from "react";
import { db, storage } from "@/firebase/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function PublishingForm({ authorId }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);

  const handlePublish = async () => {
    let imageUrl = "/no_image.png";

    if (image) {
      const imageRef = ref(storage, `texts/${authorId}/${Date.now()}-${image.name}`);
      await uploadBytes(imageRef, image);
      imageUrl = await getDownloadURL(imageRef);
    }

    await addDoc(collection(db, "texts"), {
      authorId,
      title,
      content,
      imageUrl,
      views: 0,
      createdAt: serverTimestamp(),
    });

    setTitle("");
    setContent("");
    setImage(null);
  };

  return (
    <div className="bg-white p-6 rounded shadow mb-6">
      <h2 className="text-xl font-bold mb-4">Publier un nouveau texte</h2>
      <input
        type="text"
        placeholder="Titre du texte"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border p-2 rounded mb-2"
      />
      <textarea
        placeholder="Contenu du texte"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full border p-2 rounded mb-2"
      ></textarea>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files[0])}
        className="mb-2"
      />
      <button
        onClick={handlePublish}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        Publier
      </button>
    </div>
  );
}
