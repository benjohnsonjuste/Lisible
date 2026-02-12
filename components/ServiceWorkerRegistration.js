"use client";
import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator && window.location.hostname !== "localhost") {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").then(
          (registration) => console.log("SW enregistré avec succès sur lisible.biz"),
          (err) => console.log("Échec de l'enregistrement du SW : ", err)
        );
      });
    }
  }, []);

  return null;
}
