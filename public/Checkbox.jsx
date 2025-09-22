export default function Checkbox({ label, checked, onChange }) {
  return (
    <label className="flex items-center space-x-2 mb-2">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}
