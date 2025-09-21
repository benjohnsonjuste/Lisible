// components/Layout.js
import NavbarMobile from "./Navbar"; // ton Navbar renommé en NavbarMobile
import Footer from "./Footer";

export default function Layout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Barre de navigation fixe */}
      <NavbarMobile />

      {/* Décalage pour éviter que le contenu passe sous la navbar */}
      <main className="flex-1 pt-[56px]">
        {children}
      </main>

      {/* Footer toujours en bas */}
      <Footer />
    </div>
  );
}