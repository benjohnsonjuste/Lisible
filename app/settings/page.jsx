"use client";
import React, { useState } from 'react';
import { Save, User, Camera, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    // Logique API GitHub pour PATCH le fichier user.json
    setTimeout(() => {
      toast.success("Profile updated on GitHub repository");
      setUpdating(false);
    }, 1500);
  };

  return (
    <div className="max-w-2xl mx-auto py-20 px-6">
      <h1 className="text-5xl font-black italic tracking-tighter mb-12">Settings.</h1>
      
      <form onSubmit={handleUpdate} className="space-y-8">
        <div className="flex items-center gap-6 p-8 bg-slate-50 rounded-[2rem]">
          <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center relative overflow-hidden">
            <Camera className="text-slate-400" size={24} />
          </div>
          <div>
            <p className="font-black text-xs uppercase tracking-widest">Profile Picture</p>
            <button type="button" className="text-teal-600 font-bold text-xs mt-1">Upload new image</button>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Pen Name</label>
          <input 
            className="w-full p-5 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-teal-500 font-bold"
            defaultValue="Rodley Robergeau"
          />
        </div>

        <div className="space-y-4">
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Bio / Description</label>
          <textarea 
            className="w-full p-5 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-teal-500 font-bold h-32"
            placeholder="Tell your readers who you are..."
          />
        </div>

        <button 
          disabled={updating}
          className="w-full bg-slate-950 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3"
        >
          {updating ? "Syncing..." : <><Save size={16}/> Save Changes</>}
        </button>
      </form>
    </div>
  );
}
