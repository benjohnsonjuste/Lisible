import Link from "next/link";
import { useRouter } from "next/router";
import { auth } from "@/lib/firebaseConfig";
import { signOut } from "firebase/auth";
import { useState, useEffect } from "react";
import Image from "next/image";

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
        {/* Icône Home */}
        <Link href="/" legacyBehavior>
          <a>
            <Image src="/home.svg" alt="Accueil" width={32} height={32} className="cursor-pointer" />
          </a>
        </Link>

        {/* Menu avec icônes */}
        <nav className="flex items-center gap-6">
          <Link href="/bibliotheque" legacyBehavior>
            <a>
              <Image src="/bibliotheque.svg" alt="Bibliothèque" width={32} height={32} className="hover:scale-110 transition" />
            </a>
          </Link>

          <Link href="/dashboard" legacyBehavior>
            <a>
              <Image src="/dashboard.svg" alt="Dashboard" width={32} height={32} className="hover:scale-110 transition" />
            </a>
          </Link>

          {user ? (
            <button
              onClick={handleLogout}
              className="cursor-pointer"
              title="Déconnexion"
            >
              <Image src="/logout.svg" alt="Déconnexion" width={32} height={32} className="hover:scale-110 transition" />
            </button>
          ) : (
            <Link href="/login" legacyBehavior>
              <a>
                <Image src="/login.svg" alt="Connexion" width={32} height={32} className="hover:scale-110 transition" />
              </a>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}