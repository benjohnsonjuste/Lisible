export default function ServiceCard({ icon, title, description }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center text-center">
      {icon && <img src={icon} alt={title} className="h-16 w-16 mb-4" />}
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}