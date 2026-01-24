"use client";
import AuthForm from "@/components/AuthForm";
import { BookOpen } from "lucide-react";

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-4 font-sans">
      <div className="max-w-md w-full">
        {/* Logo / Icône */}
        <div className="flex justify-center mb-8">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-xl shadow-blue-100">
            <BookOpen size={32} className="text-white" />
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 md:p-10">
          <header className="text-center mb-8">
            <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
              Lisible
            </h1>
            <p className="text-gray-500 font-medium">
              Rejoignez la communauté des lecteurs et auteurs.
            </p>
          </header>

          <AuthForm />
        </div>

        <p className="text-center text-gray-400 text-xs mt-8 px-6 leading-relaxed">
          En vous connectant, vous acceptez de partager vos textes avec la communauté Lisible sur GitHub.
        </p>
      </div>
    </div>
  );
}
