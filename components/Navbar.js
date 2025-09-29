import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { auth } from "@/lib/firebaseConfig";
import { signOut, onAuthStateChanged } from "firebase/auth";
import Image from "next/image";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // 🔹 Écoute l'état de connexion
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (e) {
      console.error(e);
    }
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleMenuClick = () => setIsMenuOpen(false);

  return (
    <>
      <header className="bg-white shadow relative z-50">
        <div className="container-lg flex items-center justify-between py-4 px-4">
          <button onClick={toggleMenu} className="cursor-pointer">
            <Image src="/menu-68.svg" alt="Menu" width={32} height={32} />
          </button>
          <Link href="/">
            <Image
              src="/home-home-6.svg"
              alt="Accueil"
              width={32}
              height={32}
              className="cursor-pointer"
            />
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/bibliotheque">
              <Image
                src="/library-12-1.svg"
                alt="Bibliothèque"
                width={32}
                height={32}
                className="hover:scale-110 transition"
              />
            </Link>
            <Link href="/dashboard">
              <Image
                src="/dashboard-85.svg"
                alt="Dashboard"
                width={32}
                height={32}
                className="hover:scale-110 transition"
              />
            </Link>
            {user ? (
              <button
                onClick={handleLogout}
                className="cursor-pointer"
                title="Déconnexion"
              >
                <Image
                  src="/logout-38.svg"
                  alt="Déconnexion"
                  width={32}
                  height={32}
                  className="hover:scale-110 transition"
                />
              </button>
            ) : (
              <Link href="/login">
                <Image
                  src="/sign-in-139.svg"
                  alt="Connexion"
                  width={32}
                  height={32}
                  className="hover:scale-110 transition"
                />
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Sidebar Menu */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 z-40 ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 relative">
          <button
            onClick={toggleMenu}
            className="absolute top-4 right-4 text-gray-600 hover:text-black"
          >
            ✖
          </button>
          <h2 className="text-xl font-semibold mb-6">Menu</h2>
          <ul className="space-y-4">
            {[
              { href: "/auteurs", label: "Auteurs", icon: "auteurs.svg" },
              { href: "/lisible-club", label: "Lisible Club", icon: "communaute.svg" },
              { href: "/evenements", label: "Événements", icon: "evenements.svg" },
              { href: "/terms", label: "Conditions d'utilisation", icon: "product-terms.svg" },
              { href: "/contact", label: "Contact", icon: "message.svg" },
            ].map((item) => (
              <li key={item.href}>
                <Link href={item.href}>
                  <a
                    onClick={handleMenuClick}
                    className="flex items-center gap-3 hover:text-blue-600"
                  >
                    <Image src={`/${item.icon}`} alt={item.label} width={24} height={24} />
                    {item.label}
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Overlay */}
      {isMenuOpen && (
        <div
          onClick={toggleMenu}
          className="fixed inset-0 bg-black bg-opacity-40 z-30"
        />
      )}
    </>
  );
}