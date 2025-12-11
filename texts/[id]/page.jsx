import React from "react";

export async function generateStaticParams() {
  // Optionnel : si tu veux ISR, sinon supprime
  return [];
}

export default async function Page({ params }) {
  const { id } = params;

  const url = `https://raw.githubusercontent.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/main/data/texts/${id}.json`;

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold">Texte introuvable</h1>
      </div>
    );
  }

  const text = await res.json();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{text.title}</h1>

      <p className="text-gray-600 mb-2">
        Auteur : <b>{text.authorName}</b>
      </p>

      <p className="text-gray-500 mb-4">
        Publié le : {new Date(text.createdAt).toLocaleDateString()}
      </p>

      {text.image && (
        <img
          src={`https://raw.githubusercontent.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/main/${text.image}`}
          alt=""
          className="mb-4 rounded"
        />
      )}

      <article className="whitespace-pre-wrap leading-relaxed text-lg">
        {text.content}
      </article>
    </div>
  );
}
