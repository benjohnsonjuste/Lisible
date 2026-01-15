"use client";
import Link from "next/link";
import { texts } from "@/lib/data";

export default function TextsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Bibliothèque</h1>
      <div className="space-y-4">
        {texts.map((t) => (
          <div key={t.id} className="border p-4 rounded shadow">
            <h2 className="text-xl font-semibold">{t.title}</h2>
            <p className="text-sm text-gray-500">
              {t.authorName} • {new Date(t.createdAt).toLocaleDateString()}
            </p>
            <div className="mt-2 flex space-x-2">
              <span>👁 {t.views}</span>
              <span>❤️ {t.likesCount}</span>
              <span>💬 {t.commentsCount}</span>
            </div>
            <Link href={`/texts/${t.id}`} className="text-blue-600 mt-2 inline-block">
              Lire
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}