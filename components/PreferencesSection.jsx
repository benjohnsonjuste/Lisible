import { useState } from 'react';

export default function PreferencesSection() {
  const [newsletter, setNewsletter] = useState(true);

  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <h3 className="font-bold mb-2">Préférences</h3>
      <label className="flex items-center space-x-2">
        <input type="checkbox" checked={newsletter} onChange={() => setNewsletter(!newsletter)} />
        <span>S’inscrire à la newsletter</span>
      </label>
    </div>
  );
}
