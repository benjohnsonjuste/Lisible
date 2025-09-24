"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { auth } from "@/firebase/firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function Navbar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u));
  }, []);

  return (
    <nav className="bg-white shadow">
      <div className="container flex items-center justify-between py-3">
        <Link href="/">
          <div className="flex items-center space-x-3">
            <img src="/favicon.ico" alt="L" className="w-8 h-8" />
            <div>
              <div className="font-bold">Lisible</div>
              <div className="text-xs text-gray-500">Soutenir la littérature de demain</div>
            </div>
          </div>
        </Link>

        <div className="flex items-center space-x-4">
          <Link href="/"><a className="text-gray-700">Accueil</a></Link>
          <Link href="/dashboard"><a className="text-gray-700">Dashboard</a></Link>
          {user ? (
            <>
              <img src={user.photoURL || "/avatar.png"} alt="avatar" className="w-8 h-8 rounded-full" />
              <button onClick={() => signOut(auth)} className="text-sm text-red-600">Déconnexion</button>
            </>
          ) : (
            <Link href="/"><a className="text-sm text-blue-600">Connexion</a></Link>
          )}
        </div>
      </div>
    </nav>
  );
}
