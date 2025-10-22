// /components/Card.jsx
export default function Card({ title, author, content, imageUrl, date }) {
  return (
    <div className="border rounded-xl p-4 shadow hover:shadow-lg transition">
      {imageUrl && (
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-40 object-cover rounded mb-2"
        />
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      {author && <p className="text-sm text-gray-600">Par {author}</p>}
      <p className="mt-2 text-gray-800 text-sm line-clamp-4">{content}</p>
      {date && (
        <p className="text-xs text-gray-400 mt-2">
          Publié le {new Date(date.seconds * 1000).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}