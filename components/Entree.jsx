export default function Entree({ label, value, onChange, type = "text" }) {
  return (
    <div className="mb-4">
      <label className="block text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full border p-2 rounded"
      />
    </div>
  );
}
