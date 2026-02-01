"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getEmailId } from "@/lib/utils"; // Importation de ton nouveau helper
import { Mail, User, Lock, ArrowRight, Loader2, ArrowLeft } from "lucide-react";

export default function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  // --- LOGIQUE NOTIFICATION ANNIVERSAIRE ---
  const checkAndNotifyBirthday = async (userData) => {
    if (!userData.birthday) return;
    const today = new Date();
    const birthDate = new Date(userData.birthday);

    if (today.getDate() === birthDate.getDate() && today.getMonth() === birthDate.getMonth()) {
      await fetch("/api/create-notif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "anniversaire",
          targetEmail: userData.email,
          message: `🎂 Joyeux anniversaire ${userData.penName || userData.name} !`,
          link: "/account"
        })
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const emailClean = formData.email.trim().toLowerCase();

      // 1. GESTION DU MODE OUBLI
      if (mode === "forgot") {
        const res = await fetch("/api/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailClean })
        });
        if (!res.ok) throw new Error("Compte inconnu");
        toast.success("Secret retrouvé, vérifiez vos notifications");
        setMode("login");
        return;
      }

      // 2. GESTION DU MODE INSCRIPTION
      if (mode === "register") {
        const regRes = await fetch("/api/register-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: emailClean,
            password: formData.password
          })
        });
        if (!regRes.ok) {
          const err = await regRes.json();
          throw new Error(err.error || "Erreur d'inscription");
        }
      }

      // 3. CONNEXION VIA TON API SECURISEE (Plus de fetch direct GitHub ici !)
      const loginRes = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailClean,
          password: formData.password
        })
      });

      const result = await loginRes.json();

      if (!loginRes.ok) throw new Error(result.error || "Identifiants invalides");

      // 4. FINALISATION
      const userData = result.user;
      await checkAndNotifyBirthday(userData);
      
      localStorage.setItem("lisible_user", JSON.stringify(userData));
      toast.success(`Heureux de vous revoir, ${userData.penName || userData.name}`);
      router.push("/dashboard");

    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ... (Garde ton code de rendu JSX identique, il est très beau !)
}
