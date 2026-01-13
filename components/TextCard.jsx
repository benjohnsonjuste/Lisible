import Link from "next/link";

export default function TextCard({ text }) {
  return (
    <div className="border rounded p-4 bg-white">
      <h2 className="text-xl font-bold">{text.title}</h2>
      <p className="text-sm text-gray-500">
        {text.authorName} · {new Date(text.createdAt).toLocaleDateString()}
      </p>

      <div className="flex gap-4 text-sm mt-2">
        <span>👁 {text.views || 0}</span>
        <span>❤️ {text.likes?.length || 0}</span>
        <span>💬 {text.commentsCount || 0}</span>
      </div>

      <Link href={`/texts/${text.id}`} className="mt-3 inline-block text-blue-600">
        Lire →
      </Link>
    </div>
  );
}