export default function BackgroundLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 via-indigo-400 to-purple-500 text-white">
      {children}
    </div>
  );
}
