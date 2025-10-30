"use client";

import AuthForm from "@/components/AuthForm";

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold text-center mb-4">
          Bienvenue sur Lisible
        </h1>
        <p className="text-center text-gray-500 mb-6">
          Connectez-vous ou inscrivez-vous pour continuer
        </p>

        <AuthForm />
      </div>
    </div>
  );
}