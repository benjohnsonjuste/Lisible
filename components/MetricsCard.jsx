export default function MetricsCard({ title, value }) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <h4 className="text-sm text-gray-500">{title}</h4>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
