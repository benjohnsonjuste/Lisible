// components/JuryDeliberation.js
import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

export default function JuryDeliberation({ eventId, isOpen }) {
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchData = async () => {
      const snapshot = await getDocs(collection(db, "eventRegistrations"));
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(reg => reg.eventId === eventId);
      setParticipants(data);
    };
    fetchData();
  }, [eventId, isOpen]);

  if (!isOpen) return <p className="text-gray-500">La délibération n'est pas encore ouverte.</p>;

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="font-bold text-lg mb-4">Délibération du jury</h3>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Nom complet</th>
            <th className="border p-2">Pays</th>
            <th className="border p-2">Nombre de J'aime</th>
            <th className="border p-2">Orthographe (25)</th>
            <th className="border p-2">Accord (25)</th>
            <th className="border p-2">Musicalité (25)</th>
            <th className="border p-2">Respect du thème (25)</th>
          </tr>
        </thead>
        <tbody>
          {participants.map((p) => (
            <tr key={p.id}>
              <td className="border p-2">{p.fullName}</td>
              <td className="border p-2">{p.country}</td>
              <td className="border p-2">{p.likes || 0}</td>
              <td className="border p-2"><input type="number" max="25" className="w-16 border rounded p-1" /></td>
              <td className="border p-2"><input type="number" max="25" className="w-16 border rounded p-1" /></td>
              <td className="border p-2"><input type="number" max="25" className="w-16 border rounded p-1" /></td>
              <td className="border p-2"><input type="number" max="25" className="w-16 border rounded p-1" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}