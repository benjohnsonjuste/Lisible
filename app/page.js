"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const handleAuthorSignup = () => {
    router.push("/register");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-16">
      {/* Header */}
      <header className="text-center">
        <h1 className="text-4xl font-bold mb-4">Bienvenue sur Lisible</h1>
        <p className="text-lg text-gray-700">
          Une plateforme moderne pour lire et publier vos textes.
        </p>
      </header>

      {/* Importance de l'écriture */}
      <section className="bg-blue-50 p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-3">L'importance de l'écriture</h2>
        <p className="text-gray-700">
          L'écriture permet d'exprimer ses idées, de partager des histoires et de stimuler la créativité.
          Elle aide à organiser sa pensée et à laisser une trace de sa réflexion.
        </p>
      </section>

      {/* Importance de la lecture */}
      <section className="bg-green-50 p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-3">L'importance de la lecture</h2>
        <p className="text-gray-700">
          La lecture enrichit l'esprit, développe l'imagination et permet de découvrir de nouvelles perspectives.
          Elle est essentielle pour apprendre, se détendre et s'évader.
        </p>
      </section>

      {/* Présentation de Lisible */}
      <section className="bg-yellow-50 p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-3">Présentation de Lisible</h2>
        <p className="text-gray-700">
          Lisible est une plateforme où les lecteurs peuvent explorer des histoires captivantes
          et où les auteurs ont la possibilité de publier leurs œuvres et de toucher un large public.
        </p>
      </section>

      {/* Bienfaits pour les lecteurs */}
      <section className="bg-purple-50 p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-3">Bienfaits pour les lecteurs</h2>
        <ul className="list-disc list-inside text-gray-700">
          <li>Accès à des textes variés et de qualité</li>
          <li>Découverte de nouveaux auteurs et genres</li>
          <li>Possibilité de suivre vos auteurs préférés</li>
        </ul>
      </section>

      {/* Bienfaits pour les auteurs */}
      <section className="bg-pink-50 p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-3">Bienfaits pour les auteurs</h2>
        <ul className="list-disc list-inside text-gray-700">
          <li>Publier vos textes facilement</li>
          <li>Monétiser votre travail</li>
          <li>Développer votre audience et votre notoriété</li>
        </ul>
      </section>

      {/* Avantages d'être auteur sur Lisible */}
      <section className="bg-orange-50 p-8 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-semibold mb-3">Avantages d'être auteur sur Lisible</h2>
        <p className="text-gray-700 mb-6">
          Créez votre profil d’auteur, publiez vos histoires, connectez-vous avec une communauté active de lecteurs passionnés et monétisez votre plume juste en écrivant.
        </p>
        <button
          type="button"
          onClick={handleAuthorSignup}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Devenir auteur
        </button>
      </section>
    </div>
  );
}