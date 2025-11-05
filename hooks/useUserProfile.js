"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

/**
 * Hook centralisé pour obtenir et mettre à jour le profil utilisateur complet.
 * Fusionne les données Firebase Auth et Firestore ("authors").
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
        const docRef = doc(db, "authors", firebaseUser.uid);
        const docSnap = await getDoc(docRef);

        // 🔹 Données existantes dans Firestore
        const authorData = docSnap.exists() ? docSnap.data() : {};

        // 🔹 Fusion Auth + Firestore
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
          createdAt: authorData.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...authorData,
        };

        // 🔹 Vérifie et complète Firestore si nécessaire
        const missingFields = {};
        if (!authorData.fullName) missingFields.fullName = mergedUser.fullName;
        if (!authorData.email) missingFields.email = mergedUser.email;
        if (!authorData.photoURL && mergedUser.photoURL)
          missingFields.photoURL = mergedUser.photoURL;
        if (Object.keys(missingFields).length > 0) {
          await setDoc(
            docRef,
            { ...missingFields, updatedAt: new Date().toISOString() },
            { merge: true }
          );
          console.log("✅ Profil Firestore mis à jour :", missingFields);
        }

        setUser(mergedUser);
      } catch (err) {
        console.error("Erreur chargement profil utilisateur:", err);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 🔹 Redirection pratique
  const redirectToAuth = (redirect = "/bibliotheque") => {
    router.push(`/auth?redirect=${encodeURIComponent(redirect)}`);
  };

  return { user, isLoading, redirectToAuth };
}