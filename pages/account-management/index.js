// pages/account-management/index.js
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";

import Header from "@/components/ui/Header";
import AppIcon from "@/components/AppIcon";
import Bouton from "@/components/ui/Bouton";

import ProfileSection from "@/components/account-management/ProfileSection";
import SecuritySection from "@/components/account-management/SecuritySection";
import PaymentSection from "@/components/account-management/PaymentSection";
import NotificationSection from "@/components/account-management/NotificationSection";
import SubscriptionSection from "@/components/account-management/SubscriptionSection";
import DangerZone from "@/components/account-management/DangerZone";

const GestionDesComptes = () => {
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("profil");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Données utilisateur fictives pour l'exemple
  const [userData, setUserData] = useState({
    profile: {
      displayName: "Marie Dubois",
      bio: "Passionnée de littérature contemporaine, j'explore l'identité et les relations humaines à travers mes récits.",
      email: "marie.dubois@email.com",
      website: "https://marie-dubois-auteure.fr",
      location: "Paris, France",
      profileImage: null,
    },
    security: {
      twoFactorEnabled: false,
    },
    payment: {
      accountHolder: "",
      iban: "",
      bic: "",
      bankName: "",
      taxId: "",
      vatNumber: "",
      businessType: "individuel",
      payoutFrequency: "mensuel",
    },
    notifications: {
      emailNotifications: true,
      newSubscribers: true,
      milestones: true,
      comments: true,
      systemUpdates: false,
      marketingEmails: false,
      pushNotifications: true,
    },
    subscriptions: [
      {
        id: 1,
        name: "Pierre Martin",
        email: "pierre.martin@email.com",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd728f2d?w=150",
        subscriptionDate: "2025-01-20",
        views: 15,
        genrePrefere: "Roman",
        lastActivity: "2025-01-25",
        isActive: true,
      },
      {
        id: 2,
        name: "Sophie Leroy",
        email: "sophie.leroy@email.com",
        avatar: "https://images.unsplash.com/photo-1507867816803-6461ffad8d80?w=150",
        subscriptionDate: "2025-01-15",
        views: 123,
        genrePrefere: "Poésie",
        lastActivity: "2025-01-23",
        isActive: true,
      },
    ],
  });

  useEffect(() => {
    // Simulation d'un chargement des données
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  if (isLoading) return <p>Chargement...</p>;

  return (
    <div className="container mx-auto py-6">
      <Header title="Gestion du compte" />

      <div className="flex gap-4 mb-6">
        {["profil", "sécurité", "paiement", "notifications", "abonnés", "danger"].map((section) => (
          <Bouton
            key={section}
            variante={activeSection === section ? "primary" : "secondary"}
            onClick={() => setActiveSection(section)}
          >
            {section.charAt(0).toUpperCase() + section.slice(1)}
          </Bouton>
        ))}
      </div>

      <div className="space-y-6">
        {activeSection === "profil" && (
          <ProfileSection
            profileData={userData.profile}
            onProfileUpdate={(updatedProfile) => {
              setUserData((prev) => ({ ...prev, profile: updatedProfile }));
              setShowSuccessMessage(true);
            }}
          />
        )}

        {activeSection === "sécurité" && (
          <SecuritySection
            securityData={userData.security}
            onSecurityUpdate={(updatedSecurity) => {
              setUserData((prev) => ({ ...prev, security: updatedSecurity }));
              setShowSuccessMessage(true);
            }}
          />
        )}

        {activeSection === "paiement" && (
          <PaymentSection
            paymentData={userData.payment}
            onPaymentUpdate={(updatedPayment) => {
              setUserData((prev) => ({ ...prev, payment: updatedPayment }));
              setShowSuccessMessage(true);
            }}
          />
        )}

        {activeSection === "notifications" && (
          <NotificationSection
            notificationData={userData.notifications}
            onNotificationUpdate={(updatedNotifications) => {
              setUserData((prev) => ({ ...prev, notifications: updatedNotifications }));
              setShowSuccessMessage(true);
            }}
          />
        )}

        {activeSection === "abonnés" && (
          <SubscriptionSection
            subscriptionData={userData.subscriptions}
            onSubscriptionUpdate={(selected) => {
              console.log("Abonnés sélectionnés :", selected);
              setShowSuccessMessage(true);
            }}
          />
        )}

        {activeSection === "danger" && (
          <DangerZone
            onAccountAction={(type) => {
              console.log("Action sur le compte :", type);
              setShowSuccessMessage(true);
            }}
          />
        )}
      </div>

      {showSuccessMessage && (
        <p className="mt-4 text-green-600 font-semibold">
          Action effectuée avec succès !
        </p>
      )}
    </div>
  );
};

export default GestionDesComptes;
