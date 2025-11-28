import React, { useEffect, useState, useRef } from "react";
import { getApps, initializeApp } from "firebase/app";
import {
getFirestore,
collection,
doc,
onSnapshot,
setDoc,
addDoc,
updateDoc,
serverTimestamp,
query,
orderBy,
getDoc,
deleteDoc,
} from "firebase/firestore";
import {
getAuth,
signInAnonymously,
onAuthStateChanged,
signInWithEmailAndPassword,
createUserWithEmailAndPassword,
signOut,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// -----------------------------
// CONFIG - remplace par tes valeurs
// -----------------------------
const firebaseConfig = {
apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "REPLACE_WITH_YOUR_API_KEY",
authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "REPLACE_WITH_AUTH_DOMAIN",
projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "REPLACE_WITH_PROJECT_ID",
storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "REPLACE_BUCKET",
messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "REPLACE_MSG_SENDER",
appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "REPLACE_APP_ID",
};

// -----------------------------
// Initialize Firebase (safe for SSR/Next.js)
// -----------------------------
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

export default function TextPage({ params }) {
const { id } = params;
const router = useRouter();
const [text, setText] = useState(null);
const [comments, setComments] = useState([]);
const [commentInput, setCommentInput] = useState("");
const [user, setUser] = useState(null);

// Auth listener
useEffect(() => {
const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
setUser(currentUser);
});
return () => unsubscribe();
}, []);

// Load text by id
useEffect(() => {
const docRef = doc(db, "texts", id);
const unsubscribe = onSnapshot(docRef, (docSnap) => {
if (docSnap.exists()) {
setText(docSnap.data());
} else {
toast.error("Texte introuvable");
router.push("/bibliotheque");
}
});
return () => unsubscribe();
}, [id, router]);

// Load comments
useEffect(() => {
const commentsRef = collection(db, "texts", id, "comments");
const q = query(commentsRef, orderBy("createdAt", "asc"));
const unsubscribe = onSnapshot(q, (snapshot) => {
setComments(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
});
return () => unsubscribe();
}, [id]);

const handleAddComment = async () => {
if (!user) {
toast.error("Connectez-vous pour commenter");
return;
}
if (!commentInput.trim()) return;

const commentsRef = collection(db, "texts", id, "comments");  
await addDoc(commentsRef, {  
  text: commentInput,  
  author: user.uid,  
  createdAt: serverTimestamp(),  
});  
setCommentInput("");  

};

if (!text) return <p className="text-center mt-10">Chargement...</p>;

return (
<main className="max-w-3xl mx-auto p-6">
<h1 className="text-2xl font-bold mb-4">{text.title}</h1>
<p className="whitespace-pre-wrap mb-4">{text.content}</p>
{text.imageUrl && <img src={text.imageUrl} alt="Illustration" className="mb-4" />}

  <div className="mt-8">  
    <h2 className="text-xl font-semibold mb-2">Commentaires</h2>  
    {comments.map((c) => (  
      <div key={c.id} className="border-b py-2">  
        <span className="font-medium">{c.author}</span>: {c.text}  
      </div>  
    ))}  

    <div className="mt-4 flex gap-2">  
      <input  
        type="text"  
        placeholder="Écrire un commentaire..."  
        value={commentInput}  
        onChange={(e) => setCommentInput(e.target.value)}  
        className="flex-1 border p-2 rounded"  
      />  
      <button  
        onClick={handleAddComment}  
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"  
      >  
        Envoyer  
      </button>  
    </div>  
  </div>  
</main>  

);
}