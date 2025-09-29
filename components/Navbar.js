import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { auth } from "@/lib/firebaseConfig";
import { signOut } from "firebase/auth";
import Image from "next/image";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setUser(auth.currentUser);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (e) {
      console.error(e);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Fonction pour fermer le menu au clic sur un lien
  const handleMenuClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="bg-white shadow relative z-50">
        <div className="container-lg flex items-center justify-between py-4 px-4">
          <button onClick={toggleMenu} className="cursor-pointer">
            <Image src="menu-68.svg" alt="Menu" width={32} height={32} />
          </button>
          <Link href="/" legacyBehavior>
            <a>
              <Image
                src="home-home-6.svg"
                alt="Accueil"
                width={32}
                height={32}
                className="cursor-pointer"
              />
            </a>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/bibliotheque" legacyBehavior>
              <a>
                <Image
                  src="library-12-1.svg"
                  alt="Bibliothèque"
                  width={32}
                  height={32}
                  className="hover:scale-110 transition"
                />
              </a>
            </Link>
            <Link href="/dashboard" legacyBehavior>
              <a>
                <Image
                  src="dashboard-85.svg"
                  alt="Dashboard"
                  width={32}
                  height={32}
                  className="hover:scale-110 transition"
                />
              </a>
            </Link>
            {user ? (
              <button
                onClick={handleLogout}
                className="cursor-pointer"
                title="Déconnexion"
              >
                <Image
                  src="logout-38.svg"
                  alt="Déconnexion"
                  width={32}
                  height={32}
                  className="hover:scale-110 transition"
                />
              </button>
            ) : (
              <Link href="/login" legacyBehavior>
                <a>
                  <Image
                    src="sign-in-139.svg"
                    alt="Connexion"
                    width={32}
                    height={32}
                    className="hover:scale-110 transition"
                  />
                </a>
              </Link>
            )}
          </nav>
        </div>
      </header>

      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 z-40 ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4">
          <button
            onClick={toggleMenu}
            className="absolute top-4 right-4 text-gray-600 hover:text-black"
          >
            ✖
          </button>
          <h2 className="text-xl font-semibold mb-6">Menu</h2>

          <ul className="space-y-4">
            <li>
              <Link href="/auteurs" legacyBehavior>
                <a
                  onClick={handleMenuClick}
                  className="flex items-center gap-3 hover:text-blue-600"
                >
                  <Image src="auteurs.svg" alt="Auteurs" width={24} height={24} />
                  Auteurs
                </a>
              </Link>
            </li>

            <li>
              <Link href="/lisibleclub" legacyBehavior>
                <a
                  onClick={handleMenuClick}
                  className="flex items-center gap-3 hover:text-blue-600"
                >
                  <Image src="communaute.svg" alt="Lisible Club" width={24} height={24} />
                  Lisible Club
                </a>
              </Link>
            </li>

            <li>
              <Link href="/evenements" legacyBehavior>
                <a
                  onClick={handleMenuClick}
                  className="flex items-center gap-3 hover:text-blue-600"
                >
                  <Image src="evenements.svg" alt="Événements" width={24} height={24} />
                  Événements
                </a>
              </Link>
            </li>

            <li>
              <Link href="/terms" legacyBehavior>
                <a
                  onClick={handleMenuClick}
                  className="flex items-center gap-3 hover:text-blue-600"
                >
                  <Image src="product-terms.svg" alt="Conditions d'utilisation" width={24} height={24} />
                  Conditions d'utilisation
                </a>
              </Link>
            </li>

            <li>
              <Link href="/contact" legacyBehavior>
                <a
                  onClick={handleMenuClick}
                  className="flex items-center gap-3 hover:text-blue-600"
                >
                  <Image src="message.svg" alt="Contact" width={24} height={24} />
                  Contact
                </a>
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {isMenuOpen && (
        <div
          onClick={toggleMenu}
          className="fixed inset-0 bg-black bg-opacity-40 z-30"
        />
      )}
    </>
  );
}