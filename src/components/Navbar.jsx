import React from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-white shadow p-4 flex justify-between">
      <Link to="/" className="font-bold text-xl">Lisible</Link>
      <div>
        <Link to="/dashboard" className="mr-4">Dashboard</Link>
        <Link to="/login">Connexion</Link>
      </div>
    </nav>
  );
}
