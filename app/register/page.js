// app/register/page.js
import React from "react";
import AuthDialog from "../../components/AuthDialog";

export default function RegisterPage() {
  return (
    <div className="register-page">
      <h1>Inscription</h1>
      <AuthDialog type="register" />
    </div>
  );
}
