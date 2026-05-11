"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Briefcase, CheckCircle, Clock, Plus } from "lucide-react";

export default function Marketplace({ user, onUpdateUser }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Charger les tâches
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const res = await fetch("/api/github-db?action=get_tasks");
    if (res.ok) {
      const data = await res.json();
      setTasks(data);
    }
    setLoading(false);
  };

  const handleAcceptTask = async (task) => {
    if (task.clientEmail === user.email) {
      return toast.error("Vous ne pouvez pas accepter votre propre tâche !");
    }

    try {
      const res = await fetch("/api/github-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "accept_task",
          taskId: task.id,
          writerEmail: user.email
        })
      });

      if (res.ok) {
        toast.success("Mission acceptée ! Au travail ✍️");
        fetchTasks();
      }
    } catch (e) {
      toast.error("Erreur lors de l'acceptation.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black italic italic">Missions Freelance</h2>
        <button className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-full font-bold text-sm">
          <Plus size={16} /> Publier une offre
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tasks.map(task => (
          <div key={task.id} className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
                  {task.category}
                </span>
                <h3 className="text-lg font-bold mt-2">{task.title}</h3>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-slate-900">{task.priceLi.toLocaleString()} Li</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase italic">Gain Brut</p>
              </div>
            </div>
            
            <p className="text-slate-600 text-sm mb-6 line-clamp-2">{task.description}</p>

            <div className="flex justify-between items-center border-t border-slate-50 pt-4">
              <div className="flex items-center gap-4 text-slate-400 text-xs font-bold">
                <span className="flex items-center gap-1"><Clock size={14}/> Ouvert</span>
              </div>
              <button 
                onClick={() => handleAcceptTask(task)}
                disabled={task.status !== 'open'}
                className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-teal-600 transition-colors disabled:bg-slate-200"
              >
                Accepter la mission
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
