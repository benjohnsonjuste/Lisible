// pages/_app.js
import "@/styles/globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import InstallPrompt from "@/components/InstallPrompt";
import { useEffect } from "react";
import { subscribeToClubPosts } from "@/lib/firebaseMessagingClient";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { AuthProvider } from "@/context/AuthContext";

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    const auth = getAuth();

    // Surveiller l'état de l'utilisateur connecté
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // S'abonner aux notifications FCM pour cet utilisateur
        subscribeToClubPosts(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthProvider>
      <Navbar />
      <main className="container-md py-6">
        <Component {...pageProps} />
      </main>
      <InstallPrompt />
      <Footer />
    </AuthProvider>
  );
}

export default MyApp;