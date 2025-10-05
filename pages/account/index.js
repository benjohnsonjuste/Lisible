"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import ProfileSection from "@/components/account-management/ProfileSection";
import NotificationSection from "@/components/account-management/NotificationSection";
import SecuritySection from "@/components/account-management/SecuritySection";
import PaymentSection from "@/components/account-management/PaymentSection";
import DangerZone from "@/components/account-management/DangerZone";

export default function AccountManagement() {
  const { user } = useAuth();

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
        <h1 className="text-2xl font-bold mb-2">⚙️ Gestion du compte</h1>
        <p className="text-muted-foreground">
          Bienvenue, <span className="font-semibold">{user.email}</span>
        </p>
      </header>

      {/* Sections principales */}
      <ProfileSection user={user} />
      <NotificationSection user={user} />
      <SecuritySection user={user} />
      <PaymentSection user={user} />
      <DangerZone user={user} />
    </div>
  );
}