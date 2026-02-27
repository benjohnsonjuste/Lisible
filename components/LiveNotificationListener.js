"use client";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function LiveNotificationListener() {
  const lastLiveId = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const checkLive = async () => {
      try {
        const res = await fetch("/api/live");
        const data = await res.json();

        if (data.isActive && data.roomID !== lastLiveId.current) {
          lastLiveId.current = data.roomID;

          // 1. Notification Interne (Toaster)
          toast.info(`DIRECT : ${data.title}`, {
            description: "Une plume vient de lancer un direct. Rejoignez la salle !",
            action: {
              label: "REJOINDRE",
              onClick: () => router.push(`/live/${data.roomID}`)
            },
            duration: 10000,
          });

          // 2. Notification Système (Push si autorisé)
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("🔴 LISIBLE EN DIRECT", {
              body: data.title,
              icon: "/icon-192.png",
              tag: data.roomID // Évite les doublons
            });
          }
        }
      } catch (e) { console.error("Polling error"); }
    };

    const interval = setInterval(checkLive, 30000); // Vérifie toutes les 30 secondes
    checkLive(); // Vérification immédiate au montage

    return () => clearInterval(interval);
  }, [router]);

  return null; // Composant invisible
}
