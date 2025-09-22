export default function LimiteErreur({ message }) {
  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
      {message}
    </div>
  );
}
