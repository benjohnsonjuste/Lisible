export default function SectionEtatDuCompte({ subscribers, views }) {
  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <h3 className="font-bold mb-2">État du compte</h3>
      <p>Abonnés : {subscribers}</p>
      <p>Vues totales : {views}</p>
    </div>
  );
}
