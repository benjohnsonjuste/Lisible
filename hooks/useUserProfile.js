"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

/**
 * Hook centralisé pour obtenir le profil utilisateur complet
 * depuis Firebase Auth + Firestore (collection "authors").
 * Fournit aussi la redirection automatique vers AuthDialog si besoin.
 */
export function useUserProfile() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        // 🔹 Récupérer document Firestore lié à l’utilisateur
        const docRef = doc(db, "authors", firebaseUser.uid);
        const docSnap = await getDoc(docRef);

        const authorData = docSnap.exists() ? docSnap.data() : {};

        // 🔹 Fusionner infos Auth et Firestore
        const mergedUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || authorData.email || "",
          fullName:
            authorData.fullName ||
            firebaseUser.displayName ||
            firebaseUser.email?.split("@")[0] ||
            "",
          displayName:
            firebaseUser.displayName ||
            authorData.fullName ||
            authorData.name ||
            "",
          photoURL: firebaseUser.photoURL || authorData.photoURL || null,
          ...authorData,
        };

        setUser(mergedUser);
      } catch (err) {
        console.error("Erreur chargement profil utilisateur:", err);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 🔹 Fonction pratique pour rediriger si non connecté
  const redirectToAuth = (redirect = "/bibliotheque") => {
    router.push(`/auth?redirect=${encodeURIComponent(redirect)}`);
  };

  return { user, isLoading, redirectToAuth };
}