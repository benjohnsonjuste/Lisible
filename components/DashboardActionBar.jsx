export default function DashboardActionBar({ actions }) {
  return (
    <div className="flex space-x-4 mb-4">
      {actions.map((action, idx) => (
        <button
          key={idx}
          onClick={action.onClick}
          className="bg-indigo-500 text-white py-2 px-4 rounded hover:bg-indigo-600"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
