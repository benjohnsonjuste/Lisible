"use client";
import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserCheck, UserX, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPodcastToggle({ adminEmail }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch('/api/github-db?type=users');
    if (res.ok) {
      const data = await res.json();
      setUsers(data.content);
    }
    setLoading(false);
  };

  const toggleHostPrivilege = async (userEmail, currentStatus) => {
    setUpdating(userEmail);
    try {
      const res = await fetch('/api/github-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateUserPrivilege',
          targetEmail: userEmail,
          canHostPodcast: !currentStatus,
          adminToken: adminEmail // Vérifié côté API
        })
      });
      if (res.ok) {
        toast.success("Privilèges mis à jour");
        fetchUsers();
      }
    } catch (e) {
      toast.error("Erreur de mise à jour");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="p-8 bg-white rounded-[2rem] shadow-xl border border-slate-100">
      <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
        <ShieldCheck className="text-indigo-600" /> Gestion des Hôtes
      </h2>
      <div className="space-y-3">
        {users.map(user => (
          <div key={user.email} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
            <div>
              <p className="font-bold text-sm">{user.penName || user.name}</p>
              <p className="text-[10px] text-slate-400">{user.email}</p>
            </div>
            <button
              onClick={() => toggleHostPrivilege(user.email, user.canHostPodcast)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                user.canHostPodcast ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'
              }`}
            >
              {updating === user.email ? <Loader2 className="animate-spin" size={14} /> : 
               user.canHostPodcast ? "Hôte Autorisé" : "Donner l'accès"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
