import { useState } from 'react';
import ImageUpload from './ImageUpload';
import TextEditor from './TextEditor';

export default function PublishingForm({ onPublish }) {
  const [title, setTitle] = useState('');
  const [image, setImage] = useState(null);
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (!title || !text) return alert('Titre et texte requis');
    onPublish({ title, text, image });
    setTitle(''); setText(''); setImage(null);
  };

  return (
    <div className="bg-white p-6 rounded shadow mb-4">
      <input
        type="text"
        placeholder="Titre du texte"
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="w-full border p-2 rounded mb-2"
      />
      <ImageUpload onUpload={setImage} />
      <TextEditor onSave={setText} />
      <button onClick={handleSubmit} className="bg-green-600 text-white py-2 px-4 rounded">Publier</button>
    </div>
  );
}
