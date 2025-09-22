export default function RecentActivity({ activities }) {
  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <h3 className="font-bold mb-2">Activité récente</h3>
      <ul className="list-disc list-inside text-sm">
        {activities.map((act, idx) => (
          <li key={idx}>{act}</li>
        ))}
      </ul>
    </div>
  );
}
