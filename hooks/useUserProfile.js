"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export function useUserProfile() {
  const [user, setUser] = useState(null);
  const [githubData, setGithubData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // 🔹 Lecture des données Firestore
          const userDoc = await getDoc(doc(db, "authors", firebaseUser.uid));
          const firebaseData = userDoc.exists() ? userDoc.data() : {};

          // 🔹 Lecture des données GitHub
          const githubRes = await fetch(`/api/get-user-github?uid=${firebaseUser.uid}`);
          const githubJson = await githubRes.json();

          if (githubJson.success) {
            setGithubData(githubJson.data);
          }

          // 🔹 Fusion Firebase + GitHub
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName:
              githubJson.data?.penName ||
              firebaseData.firstName + " " + firebaseData.lastName ||
              firebaseUser.displayName ||
              firebaseUser.email,
            photoURL:
              githubJson.data?.profileImage ||
              firebaseData.profileImage ||
              firebaseUser.photoURL ||
              "/avatar.png",
            ...firebaseData,
          });
        } catch (err) {
          console.error("Erreur useUserProfile:", err);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, githubData, loading };
}