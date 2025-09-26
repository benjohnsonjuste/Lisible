// components/AuthDialog.js
import { useState } from "react";
import { useRouter } from "next/router";
import { auth, db } from "@/lib/firebaseConfig";
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function AuthDialog({ type = "login" }){
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [error,setError] = useState("");
  const router = useRouter();
  const provider = new GoogleAuthProvider();

  const handleEmail = async ()=>{
    try{
      let userCredential;
      if(type === "login"){
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }else{
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // create author doc
        await setDoc(doc(db, "authors", userCredential.user.uid), {
          email,
          followers: 0,
          views: 0,
          createdAt: new Date().toISOString()
        });
      }
      router.push("/dashboard");
    }catch(e){
      setError(e.message);
    }
  };

  const handleGoogle = async ()=>{
    try{
      const result = await signInWithPopup(auth, provider);
      // create author doc if not exist
      await setDoc(doc(db, "authors", result.user.uid), {
        email: result.user.email,
        followers: 0,
        views: 0,
        createdAt: new Date().toISOString()
      }, { merge: true });
      router.push("/dashboard");
    }catch(e){
      setError(e.message);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">{type === "login" ? "Connexion" : "Inscription"}</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <button onClick={handleGoogle} className="w-full bg-red-500 text-white py-2 rounded mb-4">Continuer avec Google</button>
      <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full border p-2 rounded mb-2"/>
      <input type="password" placeholder="Mot de passe" value={password} onChange={e=>setPassword(e.target.value)} className="w-full border p-2 rounded mb-4"/>
      <div className="flex gap-2">
        <button onClick={handleEmail} className="btn btn-primary w-full">{type === "login" ? "Se connecter" : "S'inscrire"}</button>
      </div>
    </div>
  );
}
