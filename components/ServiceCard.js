// components/ServiceCard.js
export default function ServiceCard({ icon, title, description }) {
  return (
    <div className="bg-white shadow-md rounded-2xl p-6 hover:shadow-xl transition transform hover:-translate-y-1">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}