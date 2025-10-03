// pages/account-management/index.js
import { useAuth } from "@/context/AuthContext";

export default function AccountManagement() {
  const { user } = useAuth();

  if (!user) {
    return <p>Vous devez être connecté pour gérer votre compte.</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Gestion du compte</h1>
      <p>Bienvenue {user.email}</p>
    </div>
  );
}