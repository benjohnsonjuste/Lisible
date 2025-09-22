export default function Bouton({ label, onClick, color = "blue" }) {
  const colors = {
    blue: "bg-blue-600 hover:bg-blue-700",
    red: "bg-red-500 hover:bg-red-600",
    green: "bg-green-500 hover:bg-green-600",
  };

  return (
    <button
      onClick={onClick}
      className={`${colors[color]} text-white py-2 px-4 rounded`}
    >
      {label}
    </button>
  );
}
