"use client";

import Link from "next/link";
import { auth } from "@/firebase/firebaseConfig";
import { signOut } from "firebase/auth";

export default function Navbar() {
  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <nav className="flex justify-between items-center bg-gray-800 p-4 text-white">
      <Link href="/" className="font-bold text-lg">
        Lisible
      </Link>
      <div className="space-x-4">
        <Link href="/dashboard">Mon compte</Link>

        <Link href="/login">Connexion</Link>
        <button onClick={handleLogout} className="bg-red-500 px-3 py-1 rounded">
          Déconnexion
        </button>
      </div>
    </nav>
  );
        }
