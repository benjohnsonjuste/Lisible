import React from "react";

export default function SecuritySettings({ user }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Changer le mot de passe</h2>
      <form className="space-y-2">
        <input type="password" placeholder="Mot de passe actuel" className="input" />
        <input type="password" placeholder="Nouveau mot de passe" className="input" />
        <button className="btn-primary">Mettre à jour</button>
      </form>
    </div>
  );
}
