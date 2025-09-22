export default function ImageUpload({ onUpload }) {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) onUpload(file.name); // ici on stocke juste le nom pour simplification
  };

  return (
    <input type="file" onChange={handleFileChange} className="mb-2" />
  );
}
