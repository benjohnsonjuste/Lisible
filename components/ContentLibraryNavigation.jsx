import { Link } from 'react-router-dom';

export default function ContentLibraryNavigation({ sections }) {
  return (
    <nav className="bg-gray-100 p-2 rounded mb-4 flex space-x-4">
      {sections.map((section, idx) => (
        <Link
          key={idx}
          to={section.path}
          className="text-gray-700 hover:text-blue-600 font-semibold"
        >
          {section.label}
        </Link>
      ))}
    </nav>
  );
}
