"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function PublishPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target);
    const payload = {
      title: formData.get('title'),
      category: formData.get('category'),
      isConcours: formData.get('isConcours') === 'on',
      content: content,
      penName: "Current User", // To be replaced by session
      authorEmail: "user@lisible.ht"
    };

    try {
      const res = await fetch('/api/github-db', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success("Work published to the Data Lake!");
        router.push('/library');
      }
    } catch (err) {
      toast.error("Cloud synchronization failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-20 px-6">
      <form onSubmit={handleSubmit} className="space-y-12">
        <div className="space-y-4">
          <input 
            name="title"
            className="text-6xl font-black italic tracking-tighter w-full outline-none border-b-4 border-slate-50 focus:border-teal-500 transition-all"
            placeholder="Work Title"
            required
          />
          <select name="category" className="w-full p-4 bg-slate-50 rounded-xl font-bold text-slate-500">
            <option value="Poetry">Poetry</option>
            <option value="Novel">Novel</option>
            <option value="Essay">Essay</option>
            <option value="Battle">Battle</option>
          </select>
        </div>

        <textarea 
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-[500px] text-xl font-serif leading-relaxed outline-none bg-slate-50/30 p-8 rounded-[3rem] border border-transparent focus:border-slate-100"
          placeholder="Start your masterpiece here..."
          required
        />

        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" name="isConcours" className="w-6 h-6 rounded-full accent-teal-600" />
            <span className="font-black italic uppercase text-xs text-slate-400 group-hover:text-slate-900">Enter this work into the current contest</span>
          </label>

          <button 
            disabled={loading}
            className="bg-slate-950 text-white px-12 py-5 rounded-full font-black uppercase text-xs tracking-[0.2em] hover:bg-teal-600 transition-all disabled:opacity-20"
          >
            {loading ? "Committing to GitHub..." : "Publier"}
          </button>
        </div>
      </form>
    </div>
  );
}
