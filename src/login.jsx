import React from "react";
import AuthDialog from "../components/AuthDialog";

export default function LoginPage() {
  return (
    <div className="login-page">
      <h1 className="text-2xl font-bold text-center my-6">Connexion</h1>
      <AuthDialog type="login" />
    </div>
  );
}