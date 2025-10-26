import TextLibrary from "@/components/TextLibrary";

export default function LibraryPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <h1 className="text-2xl font-bold text-center mb-6">Bibliothèque Lisible</h1>
      <TextLibrary />
    </div>
  );
}