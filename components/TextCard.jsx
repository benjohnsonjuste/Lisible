export default function TextCard({ title, author, views, onClick }) {
  return (
    <div className="border p-4 rounded shadow mb-2 cursor-pointer hover:bg-gray-100" onClick={onClick}>
      <h2 className="font-bold text-lg">{title}</h2>
      <p className="text-sm text-gray-500">Auteur : {author}</p>
      <p className="text-sm text-gray-500">Vues : {views}</p>
    </div>
  );
}
