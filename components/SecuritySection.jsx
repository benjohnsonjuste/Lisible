export default function SecuritySection({ onChangePassword }) {
  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <h3 className="font-bold mb-2">Sécurité</h3>
      <button
        onClick={onChangePassword}
        className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
      >
        Changer le mot de passe
      </button>
    </div>
  );
}
