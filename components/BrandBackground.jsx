export default function BrandedBackground({ children }) {
  return (
    <div className="relative w-full min-h-screen bg-gradient-to-b from-blue-500 to-indigo-600 text-white">
      {children}
    </div>
  );
}