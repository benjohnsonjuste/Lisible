export default function Progress({ percentage }) {
  return (
    <div className="w-full bg-gray-200 rounded h-4 mt-2">
      <div
        className="bg-blue-600 h-4 rounded"
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
}
