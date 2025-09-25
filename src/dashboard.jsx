import React from "react";
import Navbar from "../components/Navbar";

export default function DashboardPage() {
  return (
    <div>
      <Navbar />
      <div className="p-6">
        <h1 className="text-2xl font-bold">Mon Dashboard</h1>
        <p className="mt-4">Bienvenue dans votre espace auteur.</p>
      </div>
    </div>
  );
}