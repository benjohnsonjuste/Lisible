export default function Entete({ title, subtitle }) {
  return (
    <header className="w-full py-8 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-center mb-6">
      <h1 className="text-4xl font-bold">{title}</h1>
      <p className="text-lg mt-2">{subtitle}</p>
    </header>
  );
}
