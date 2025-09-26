import Link from "next/link";
import { useRouter } from "next/router";
import { auth } from "@/lib/firebaseConfig";
import { signOut } from "firebase/auth";
import { useState, useEffect } from "react";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const u = auth.currentUser;
      setUser(u);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="bg-white shadow">
      <div className="container-lg flex items-center justify-between py-4 px-4">
        {/* Icône Home à la place de "Lisible" */}
        <Link href="/">
          <img
            src="/assets/icons/home.svg"
            alt="Accueil"
            className="w-8 h-8 cursor-pointer"
          />
        </Link>

        {/* Menu avec icônes */}
        <nav className="flex items-center gap-6">
          <Link href="/bibliotheque">
            <img
              src="/assets/icons/bibliotheque.svg"
              alt="Bibliothèque"
              className="w-8 h-8 cursor-pointer hover:scale-110 transition"
            />
          </Link>

          <Link href="/dashboard">
            <img
              src="/assets/icons/dashboard.svg"
              alt="Dashboard"
              className="w-8 h-8 cursor-pointer hover:scale-110 transition"
            />
          </Link>

          {user ? (
            <button
              onClick={handleLogout}
              className="cursor-pointer"
              title="Déconnexion"
            >
              <img
                src="/assets/icons/logout.svg"
                alt="Déconnexion"
                className="w-8 h-8 hover:scale-110 transition"
              />
            </button>
          ) : (
            <Link href="/login">
              <img
                src="/assets/icons/login.svg"
                alt="Connexion"
                className="w-8 h-8 cursor-pointer hover:scale-110 transition"
              />
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}