import React from "react";
import AuthDialog from "../components/AuthDialog";

export default function RegisterPage() {
  return (
    <div className="register-page">
      <h1 className="text-2xl font-bold text-center my-6">Inscription</h1>
      <AuthDialog type="register" />
    </div>
  );
}
