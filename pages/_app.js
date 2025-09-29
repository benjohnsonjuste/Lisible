import { useEffect } from "react";
import "@/styles/globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import InstallPrompt from "@/components/InstallPrompt";
import { subscribeToClubPosts } from "@/lib/subscribeToClubPosts";

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Abonnement automatique de l'utilisateur aux notifications
    subscribeToClubPosts();
  }, []);

  return (
    <>
      <Navbar />
      <main className="container-md py-6">
        <Component {...pageProps} />
      </main>
      <InstallPrompt />
      <Footer />
    </>
  );
}

export default MyApp;