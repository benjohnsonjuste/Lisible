export default function MetricsCard({ title, value, icon }) {
  return (
    <div className="bg-white p-4 rounded shadow flex items-center justify-between">
      <div>
        <h3 className="text-gray-500">{title}</h3>
        <p className="text-2xl font-bold">{value}</p>
      </div>
      {icon && <div className="text-3xl">{icon}</div>}
    </div>
  );
}
