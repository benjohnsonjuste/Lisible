// app/register/page.js
import AuthDialog from "@/components/AuthDialog";

export const metadata = {
  title: "Inscription | Lisible",
  description: "Créez votre compte sur Lisible pour commencer à publier et lire des œuvres originales.",
};

export default function RegisterPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="w-full max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-900">
          Rejoindre Lisible
        </h2>
        <p className="text-center text-gray-600 mb-8">
          Devenez membre de la communauté littéraire.
        </p>
        
        <AuthDialog type="register" />
      </div>
    </main>
  );
}
