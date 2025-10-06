"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import ProfileForm from "@/components/account/ProfileForm";
import NotificationsSettings from "@/components/account/NotificationsSettings";
import PaymentSection from "@/components/account/PaymentMethods";
import EarningsAndPayouts from "@/components/account/EarningsAndPayouts
import PublicationsList from "@/components/account/PublicationsList
import SecuritySettings from "@/components/account/SecuritySettings";
import DangerZone from "@/components/account/DangerZone";

export default function AccountManagement() {
  const { user } = useAuth();
  const [section, setSection] = useState("profile");

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p>⚠️ Vous devez être connecté pour gérer votre compte.</p>
      </div>
    );
  }

  const sections = {
    profile: <ProfileForm
user={user} />,
    notifications: <NotificationsSettings user={user} />,
    payments: <PaymentMethods
user={user} />,
    earnings: <EarningsAndPayouts
user={user} />,
    publications: <PublicationsList
user={user} />,
    security: <SecuritySettings user={user} />,
    danger: <DangerZone
user={user} />
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 p-6">
      <PublicationsList active={section} setActive={setSection} />
      <div className="flex-1 bg-card border border-border rounded-xl p-6 shadow-sm">
        {sections[section]}
      </div>
    </div>
  );
}