"use client";
import { useEffect } from "react";
import OneSignal from "react-onesignal";

export default function NotificationInitializer() {
  useEffect(() => {
    // On n'initialise OneSignal que si on est dans le navigateur
    if (typeof window !== "undefined") {
      OneSignal.init({
        appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID, // Votre ID Public
        allowLocalhostAsSecureOrigin: true,
        notifyButton: {
          enable: true, // Affiche une petite cloche discrète en bas à droite
        },
        welcomeNotification: {
          title: "Bienvenue au Club !",
          message: "Vous serez averti dès qu'un auteur lance un direct.",
        }
      }).then(() => {
        console.log("OneSignal est prêt.");
      });
    }
  }, []);

  return null; // Ce composant n'affiche rien visuellement à part la cloche optionnelle
}
