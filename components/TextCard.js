// components/TextCard.js
export default function TextCard({ text, onLike }) {
  const shareText = async () => {
    if (navigator.share) {
      await navigator.share({
        title: text.title,
        text: text.content,
        url: window.location.href,
      });
    } else {
      alert("Le partage n'est pas supporté sur ce navigateur.");
    }
  };

  return (
    <div className="p-4 border rounded shadow mb-3">
      <h4 className="font-bold">{text.title}</h4>
      <p className="text-gray-700 mb-3">{text.content}</p>
      <div className="flex justify-between items-center">
        {text.phase !== 3 && (
          <button
            onClick={() => onLike(text.id)}
            className="bg-blue-500 text-white px-3 py-1 rounded"
          >
            👍 J'aime ({text.likes})
          </button>
        )}
        <button
          onClick={shareText}
          className="bg-green-500 text-white px-3 py-1 rounded"
        >
          Partager
        </button>
      </div>
    </div>
  );
}