import TextLibrary from "@/components/TextLibrary";

export default function LibraryPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Bibliothèque Lisible</h1>
      <UploadForm />
      <div className="mt-6">
        <TextLibrary/>
      </div>
    </div>
  );
}