"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function MarketplaceList({ user, refreshTrigger, onAction }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch("/api/github-db?action=get_tasks");
        if (res.ok) {
          const data = await res.json();
          // On n'affiche que les missions ouvertes ou liées à l'utilisateur
          setTasks(data);
        }
      } catch (e) {
        toast.error("Impossible de charger les missions.");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [refreshTrigger]);

  const handleAccept = async (taskId) => {
    if (!user) return toast.error("Vous devez être connecté pour accepter une mission.");
    
    const t = toast.loading("Acceptation de la mission...");
    try {
      const res = await fetch("/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "accept_task",
          taskId: taskId,
          userEmail: user.email
        })
      });

      if (res.ok) {
        toast.success("Mission acceptée ! Retrouvez-la dans votre espace.", { id: t });
        onAction(); // Déclenche le rafraîchissement du Hub
      } else {
        const err = await res.json();
        toast.error(err.error || "Erreur lors de l'acceptation.", { id: t });
      }
    } catch (e) {
      toast.error("Erreur réseau.", { id: t });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="animate-spin text-teal-600" size={32} />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Chargement de l'Atelier...</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-24 bg-white border border-slate-100 rounded-[2.5rem] p-8">
        <AlertCircle className="mx-auto text-slate-300 mb-4" size={40} />
        <h3 className="font-black text-slate-700 text-lg">Aucune mission disponible</h3>
        <p className="text-slate-400 text-sm mt-1">Soyez le premier à publier une offre de service !</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {tasks.map((task) => {
        const isClient = task.clientEmail === user?.email;
        const isWriter = task.writerEmail === user?.email;
        const commission = Math.floor(task.priceLi * 0.15);
        const gainNet = task.priceLi - commission;

        return (
          <div 
            key={task.id} 
            className={`bg-white border p-8 rounded-[2.5rem] transition-all flex flex-col justify-between md:flex-row md:items-center gap-6 ${
              isClient ? "border-teal-500/30 ring-4 ring-teal-50" : "border-slate-100 shadow-sm hover:shadow-xl"
            }`}
          >
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
                  {task.category || "Service"}
                </span>
                {isClient && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 bg-slate-100 px-3 py-1 rounded-full">
                    Votre commande
                  </span>
                )}
              </div>
              
              <h3 className="text-xl font-black text-slate-900 tracking-tight">{task.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed max-w-2xl line-clamp-2">{task.description}</p>
            </div>

            <div className="flex flex-row md:flex-col justify-between items-center md:items-end gap-4 border-t md:border-t-0 border-slate-50 pt-4 md:pt-0 min-w-[180px]">
              <div className="md:text-right group relative cursor-help">
                <p className="text-2xl font-black text-slate-900 tracking-tighter">
                  {task.priceLi.toLocaleString()} <span className="text-xs font-black text-teal-600">Li</span>
                </p>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider italic">
                  Net écrivain : {gainNet.toLocaleString()} Li *
                </p>
                {/* Tooltip explicatif pour la commission */}
                <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block bg-slate-900 text-white text-[10px] font-bold p-2.5 rounded-xl shadow-xl w-48 z-10">
                  Frais Lisible (15%) : -{commission} Li inclus.
                </div>
              </div>

              {task.status === "open" ? (
                <button
                  onClick={() => handleAccept(task.id)}
                  disabled={isClient}
                  className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-teal-600 disabled:bg-slate-200 disabled:text-slate-400 transition-all self-stretch md:self-auto text-center"
                >
                  {isClient ? "En attente d'écrivain" : "Accepter"}
                </button>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-600 font-black uppercase tracking-wider text-[10px] bg-amber-50 px-3 py-1.5 rounded-xl">
                  <Clock size={12} /> {task.status === "in_progress" ? "En cours" : "Vérification"}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
