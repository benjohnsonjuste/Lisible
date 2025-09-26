// components/Navbar.js
import Link from "next/link";
import { useRouter } from "next/router";
import { auth } from "@/firebase/firebaseConfig";
import { signOut } from "firebase/auth";
import { useState, useEffect } from "react";

export default function Navbar(){
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(()=>{
    // minimal client-side check
    try{
      const u = auth.currentUser;
      setUser(u);
    }catch(e){}
  },[]);

  const handleLogout = async ()=>{
    try{
      await signOut(auth);
      router.push("/login");
    }catch(e){
      console.error(e);
    }
  };

  return (
    <header className="bg-white shadow">
      <div className="container-lg flex items-center justify-between py-4">
        <Link href="/"><a className="text-2xl font-bold">Lisible</a></Link>
        <nav className="flex items-center gap-4">
          <Link href="/bibliotheque"><a className="text-sm text-gray-700">Bibliothèque</a></Link>
          <Link href="/dashboard"><a className="text-sm text-gray-700">Dashboard</a></Link>
          {user ? (
            <button onClick={handleLogout} className="btn btn-primary">Déconnexion</button>
          ) : (
            <>
              <Link href="/login"><a className="text-sm">Connexion</a></Link>
              <Link href="/register"><a className="btn btn-primary">Inscription</a></Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
    }
