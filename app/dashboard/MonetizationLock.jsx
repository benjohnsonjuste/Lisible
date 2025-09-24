// components/MonetizationLock.jsx
export default function MonetizationLock({ followers }) {
  const unlocked = followers >= 250;

  return (
    <div className="bg-gray-100 p-4 rounded shadow mb-6">
      <h2 className="text-lg font-bold mb-2">Monétisation</h2>
      {unlocked ? (
        <p className="text-green-600 font-semibold">
          ✅ Monétisation activée - Vous pouvez gagner de l'argent avec vos textes.
        </p>
      ) : (
        <p className="text-red-600">
          🔒 La monétisation sera activée lorsque vous atteindrez 250 abonnés.
        </p>
      )}
    </div>
  );
}