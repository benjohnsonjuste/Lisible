"use client";

import { useEffect, useState } from "react";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/get-users");
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (loading) return <p className="text-center mt-10">Chargement...</p>;
  if (users.length === 0) return <p className="text-center mt-10">Aucun utilisateur inscrit.</p>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Utilisateurs Lisible</h1>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map(user => (
            <div key={user.id} className="bg-white rounded-xl shadow-md p-4 flex flex-col items-center">
              <img src={user.avatar} alt={user.firstName} className="w-24 h-24 rounded-full mb-2" />
              <h2 className="font-semibold">{user.firstName} {user.lastName}</h2>
              {user.penName && <p className="text-sm text-gray-500">({user.penName})</p>}
              <p className="text-xs text-gray-400 mb-2">{user.email}</p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                Suivre
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
