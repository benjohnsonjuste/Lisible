"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import ProfileForm from "@/components/account/ProfileForm";
import NotificationsSettings from "@/components/account/NotificationsSettings";
import SecuritySettings from "@/components/account/SecuritySettings";
import PaymentMethods from "@/components/account/PaymentMethods";
import DangerZone from "@/components/account/DangerZone";

export default function AccountManagement() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <p className="text-lg text-muted-foreground">
          Chargement de votre compte...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <p className="text-lg text-muted-foreground">
          Vous devez être connecté pour gérer votre compte.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <header>
        <h1 className="text-2xl font-bold mb-2 text-blue-400">
          ⚙️ Gérer mon compte
        </h1>
        <p className="text-muted-foreground">
          Bienvenue,{" "}
          <span className="font-semibold">{user?.email || "Utilisateur"}</span>
        </p>
      </header>

      {/* Sections principales */}
      <ProfileForm user={user} />
      <NotificationsSettings user={user} />
      <SecuritySettings user={user} />
      <PaymentMethods user={user} />
      <DangerZone user={user} />
    </div>
  );
}