"use client";
import React, { useState, useEffect } from "react";
import { Search, UserPlus, X, Loader2, CheckCircle2, Mail } from "lucide-react";
import { toast } from "sonner";

export default function InviteModal({ isOpen, onClose, adminEmail, liveData }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(null);

  // Charger la liste des utilisateurs pour la recherche
  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await fetch(`https://raw.githubusercontent.com/${process.env.NEXT_PUBLIC_GITHUB_REPO}/main/data/users.json`);
      if (res.ok) {
        const data = await res.json();
        // On exclut l'admin actuel de la liste des invités
        setUsers(data.content.filter(u => u.email !== adminEmail));
      }
    } catch (e) {
      toast.error("Impossible de charger les plumes.");
    } finally {
      setLoading(false);
    }
  }

  async function sendInvite(targetUser) {
    setInviting(targetUser.email);
    try {
      const res = await fetch("/api/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "invite",
          admin: adminEmail,
          targetEmail: targetUser.email,
          roomID: liveData?.roomID,
          title: liveData?.title
        })
      });

      if (res.ok) {
        toast.success(`Invitation envoyée à ${targetUser.name || targetUser.penName}`);
      } else {
        throw new Error();
      }
    } catch (e) {
      toast.error("Erreur lors de l'envoi de l'invitation.");
    } finally {
      setInviting(null);
    }
  }

  if (!isOpen) return null;

  const filteredUsers = users.filter(u => 
    (u.name || u.penName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-[#FCFBF9]">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Inviter une plume</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Direct: {liveData?.title}</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white rounded-2xl shadow-sm hover:bg-rose-50 hover:text-rose-600 transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-6">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-500 transition-colors" size={18} />
            <input 
              autoFocus
              type="text"
              placeholder="Nom ou email de la plume..."
              className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-4 pl-14 pr-6 text-sm font-medium outline-none focus:border-teal-500 focus:bg-white transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* User List */}
        <div className="px-6 pb-8 space-y-3 max-h-[300px] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-teal-600" /></div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <div key={user.email} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-[2rem] hover:border-teal-200 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden border-2 border-white shadow-sm">
                    <img 
                      src={user.image || user.profilePic || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${user.email}`} 
                      alt={user.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">{user.penName || user.name || "Plume Anonyme"}</h4>
                    <p className="text-[10px] text-slate-400 font-medium truncate w-32">{user.email}</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => sendInvite(user)}
                  disabled={inviting === user.email}
                  className={`p-3 rounded-xl transition-all ${
                    inviting === user.email 
                    ? "bg-slate-50 text-teal-600" 
                    : "bg-teal-50 text-teal-600 hover:bg-teal-600 hover:text-white"
                  }`}
                >
                  {inviting === user.email ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <UserPlus size={18} />
                  )}
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-slate-300">
              <Mail className="mx-auto mb-2 opacity-20" size={32} />
              <p className="text-xs font-bold uppercase tracking-widest">Aucune plume trouvée</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 text-center">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            L'invitation apparaîtra dans les notifications de la plume
          </p>
        </div>
      </div>
    </div>
  );
}
