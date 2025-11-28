import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { getApps, initializeApp } from "firebase/app";
import {
getFirestore, collection, doc, getDoc, onSnapshot, addDoc, serverTimestamp
} from "firebase/firestore";
import {
getAuth, onAuthStateChanged
} from "firebase/auth";

// -----------------------------
// CONFIG FIREBASE
// -----------------------------
const firebaseConfig = {
apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

export default function TextPage() {
const router = useRouter();
const { id } = router.query;
const [text, setText] = useState(null);
const [comments, setComments] = useState([]);
const [commentValue, setCommentValue] = useState("");
const [user, setUser] = useState(null);
const [loading, setLoading] = useState(true);

// Charger l'utilisateur Firebase Auth
useEffect(() => {
const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
return () => unsubscribe();
}, []);

// Charger le texte depuis Firestore
useEffect(() => {
if (!id) return;
const docRef = doc(db, "texts", id);
const unsubscribe = onSnapshot(docRef, (docSnap) => {
if (docSnap.exists()) {
setText(docSnap.data());
} else {
toast.error("Texte non trouvé.");
router.push("/bibliotheque");
}
setLoading(false);
});
return () => unsubscribe();
}, [id]);

// Ajouter un commentaire
const handleAddComment = async () => {
if (!commentValue.trim()) return;
if (!user) {
toast.error("Connectez-vous pour commenter.");
return;
}
try {
await addDoc(collection(db, "texts", id, "comments"), {
content: commentValue,
authorUid: user.uid,
authorEmail: user.email || "",
createdAt: serverTimestamp(),
});
setCommentValue("");
toast.success("Commentaire ajouté !");
} catch (err) {
console.error(err);
toast.error("Erreur lors de l'ajout du commentaire.");
}
};

if (loading) return <p className="text-center mt-10">Chargement...</p>;
if (!text) return null;

return (
<main className="max-w-3xl mx-auto p-6 space-y-6">
<h1 className="text-2xl font-bold">{text.title}</h1>
<p className="text-gray-600">Par {text.authorName || "Auteur inconnu"}</p>

  {text.imageBase64 && (  
    <img  
      src={text.imageBase64}  
      alt={text.imageName || "Image du texte"}  
      className="max-w-full rounded shadow mt-4"  
    />  
  )}  

  <div className="mt-4 whitespace-pre-wrap">{text.content}</div>  

  <section className="mt-8">  
    <h2 className="text-xl font-semibold mb-2">Commentaires</h2>  
    {comments.map((c) => (  
      <div key={c.id} className="border-b py-2">  
        <p className="text-gray-800">{c.content}</p>  
        <p className="text-sm text-gray-500">{c.authorEmail}</p>  
      </div>  
    ))}  

    {user ? (  
      <div className="mt-4 flex flex-col space-y-2">  
        <textarea  
          value={commentValue}  
          onChange={(e) => setCommentValue(e.target.value)}  
          placeholder="Écris un commentaire..."  
          className="border p-2 rounded w-full"  
          rows={3}  
        />  
        <button  
          onClick={handleAddComment}  
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"  
        >  
          Ajouter  
        </button>  
      </div>  
    ) : (  
      <p className="text-gray-500 mt-2">Connectez-vous pour commenter.</p>  
    )}  
  </section>  
</main>  

);
}