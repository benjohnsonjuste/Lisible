import { useState } from 'react';

export default function TextEditor({ onSave }) {
  const [content, setContent] = useState('');

  const handleSave = () => {
    if (onSave) onSave(content);
    setContent('');
  };

  return (
    <div className="mb-4">
      <textarea
        className="w-full border p-2 rounded mb-2"
        rows="8"
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Écrivez votre texte ici..."
      ></textarea>
      <button onClick={handleSave} className="bg-blue-600 text-white py-2 px-4 rounded">Publier</button>
    </div>
  );
}
