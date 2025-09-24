"use client";

import React from "react";
import { useRouter } from "next/navigation";
import AuthDialog from "@/components/AuthDialog";

export default function LoginPage() {
  const router = useRouter();

  // Callback quand la connexion est réussie
  const handleLoginSuccess = () => {
    router.push("/dashboard"); // Redirection vers app/dashboard/page.js
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <h1 className="text-3xl font-bold mb-6">Connexion</h1>
      <div className="w-full max-w-md">
        <AuthDialog onLoginSuccess={handleLoginSuccess} />
      </div>
    </div>
  );
}