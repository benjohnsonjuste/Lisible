export default function MonetizationLock({ followers }){
  const unlocked = (followers >= 250);
  return (
    <div className="bg-white p-4 rounded shadow mb-6">
      <h4 className="font-bold">Monétisation</h4>
      {unlocked ? (
        <p className="text-green-600">✅ Monétisation activée</p>
      ) : (
        <p className="text-red-600">🔒 Monétisation verrouillée (250 abonnés requis)</p>
      )}
    </div>
  );
}
