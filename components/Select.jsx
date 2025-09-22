export default function Select({ label, options, value, onChange }) {
  return (
    <div className="mb-4">
      <label className="block text-gray-700 mb-1">{label}</label>
      <select
        value={value}
        onChange={onChange}
        className="w-full border p-2 rounded"
      >
        {options.map((opt, idx) => (
          <option key={idx} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
