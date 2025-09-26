// components/PublishingForm.js
import { useState } from "react";
import { db, storage } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function PublishingForm({ authorId }){
  const [title,setTitle]=useState("");
  const [content,setContent]=useState("");
  const [image,setImage]=useState(null);
  const [loading,setLoading]=useState(false);

  const publish = async ()=>{
    setLoading(true);
    try{
      let imageUrl = "/no_image.png";
      if(image){
        const storageRef = ref(storage, `texts/${authorId}/${Date.now()}_${image.name}`);
        await uploadBytes(storageRef, image);
        imageUrl = await getDownloadURL(storageRef);
      }
      await addDoc(collection(db, "texts"), {
        authorId,
        title,
        content,
        imageUrl,
        views: 0,
        createdAt: serverTimestamp()
      });
      setTitle(""); setContent(""); setImage(null);
      alert("Texte publié");
    }catch(e){
      console.error(e);
      alert("Erreur publication");
    }finally{
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow mb-6">
      <h3 className="text-lg font-bold mb-3">Publier un nouveau texte</h3>
      <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Titre" className="w-full border p-2 rounded mb-2"/>
      <textarea value={content} onChange={(e)=>setContent(e.target.value)} placeholder="Contenu" className="w-full border p-2 rounded mb-2 h-40"/>
      <input type="file" accept="image/*" onChange={(e)=>setImage(e.target.files[0])} className="mb-3"/>
      <button onClick={publish} disabled={loading} className="btn btn-primary">{loading ? "Publication..." : "Publier"}</button>
    </div>
  );
}
