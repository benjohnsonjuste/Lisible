import "../styles/globals.css"; // Import des styles globaux
import { useEffect } from "react";
import { auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Exemple : observer l'état de l'utilisateur (facultatif)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("Utilisateur connecté :", user.email);
      } else {
        console.log("Utilisateur non connecté");
      }
    });
    return () => unsubscribe();
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
