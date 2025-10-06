"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";

// 🔹 Import des sous-composants
import ProfileForm from "@/components/account/ProfileForm";
import NotificationsSettings from "@/components/account/NotificationsSettings";
import PaymentMethods from "@/components/account/PaymentMethods";
import EarningsAndPayouts from "@/components/account/EarningsAndPayouts";
import PublicationsList from "@/components/account/PublicationsList";
import SecuritySettings from "@/components/account/SecuritySettings";
import DangerZone from "@/components/account/DangerZone";

export default function AccountManagement() {
  const { user, loading } = useAuth();

  // 🔄 Chargement
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <p className="text-lg text-muted-foreground">
          Chargement de votre compte...
        </p>
      </div>
    );
  }

  // 🔐 Si non connecté
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <p className="text-lg text-muted-foreground mb-4">
          ⚠️ Vous devez être connecté pour gérer votre compte.
        </p>
        <a
          href="/login"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
        >
          Se connecter
        </a>
      </div>
    );
  }

  // ✅ Page complète avec toutes les sections
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-10">
      {/* En-tête */}
      <header className="text-center">
        <h1 className="text-2xl font-bold mb-2 text-blue-500">
          ⚙️ Gérer mon compte
        </h1>
        <p className="text-muted-foreground">
          Bienvenue,{" "}
          <span className="font-semibold">{user?.email || "Auteur"}</span>
        </p>
      </header>

      {/* ✅ Sections principales */}
      <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <ProfileForm user={user} />
      </section>

      <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <NotificationsSettings user={user} />
      </section>

      <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <SecuritySettings user={user} />
      </section>

      <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <PaymentMethods user={user} />
      </section>

      <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <EarningsAndPayouts user={user} />
      </section>

      <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <PublicationsList user={user} />
      </section>

      <section className="bg-destructive/5 border border-destructive rounded-xl p-6 shadow-sm">
        <DangerZone user={user} />
      </section>
    </div>
  );
}