export default function ServiceCard({ title, description, icon }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center text-center hover:shadow-xl transition-shadow">
      {icon && <div className="mb-4 text-4xl">{icon}</div>}
      <h3 className="text-xl sm:text-2xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 text-sm sm:text-base">{description}</p>
    </div>
  );
}