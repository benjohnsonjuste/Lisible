"use client";
import { useState } from "react";
import { toast } from "sonner";

export default function CreateTaskModal({ user, refreshTasks }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priceLi: 5000,
    category: "Correction"
  });

  const handleSubmit = async () => {
    if (user.li < formData.priceLi) {
      return toast.error("Solde de Li insuffisant pour cette mission !");
    }

    const res = await fetch("/api/marketplace", {
      method: "POST",
      body: JSON.stringify({
        action: "create_task",
        userEmail: user.email,
        taskData: { ...formData, id: Date.now(), clientEmail: user.email }
      })
    });

    if (res.ok) {
      toast.success("Mission publiée ! Les Li sont réservés.");
      refreshTasks();
    }
  };

  return (
    <div className="p-8 bg-white rounded-[2.5rem] border-2 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
      <h3 className="text-xl font-black italic mb-6">Nouvelle Mission</h3>
      
      <div className="space-y-4">
        <input 
          className="w-full p-3 rounded-xl border border-slate-200 font-bold"
          placeholder="Titre (ex: Bêta-lecture roman)"
          onChange={(e) => setFormData({...formData, title: e.target.value})}
        />
        
        <textarea 
          className="w-full p-3 rounded-xl border border-slate-200 h-32"
          placeholder="Détaillez vos besoins..."
          onChange={(e) => setFormData({...formData, description: e.target.value})}
        ></textarea>

        <div className="flex items-center justify-between bg-teal-50 p-4 rounded-2xl">
          <span className="font-black text-teal-900">Budget (en Li)</span>
          <input 
            type="number"
            className="w-24 p-2 rounded-lg border-none font-black text-teal-600 bg-white"
            value={formData.priceLi}
            onChange={(e) => setFormData({...formData, priceLi: parseInt(e.target.value)})}
          />
        </div>

        <button 
          onClick={handleSubmit}
          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-teal-600 transition-all"
        >
          Publier et Bloquer {formData.priceLi} Li
        </button>
      </div>
    </div>
  );
}
