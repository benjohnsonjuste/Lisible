// pages/_app.js
import "@/styles/globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

function MyApp({ Component, pageProps }) {
  return (
    <>
      {/* Barre de navigation en haut */}
      <Navbar />

      {/* Contenu principal */}
      <main className="container-md py-6">
        <Component {...pageProps} />
      </main>

      {/* Footer affiché sur toutes les pages */}
      <Footer />
    </>
  );
}

export default MyApp;