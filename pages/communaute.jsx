"use client";
import { useEffect, useState } from "react";
import { UserPlus, UserMinus, Star, ShieldCheck, Users as UsersIcon, ArrowRight, TrendingUp, Crown } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function UsersPage() {
  const [authors, setAuthors] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const logged = localStorage.getItem("lisible_user");
    if (logged) setCurrentUser(JSON.parse(logged));
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/users?t=${Date.now()}`);
      const files = await res.json();
      const dataPromises = files
        .filter(f => f.name.endsWith('.json'))
        .map(f => fetch(f.download_url).then(r => r.json()));
      
      const allUsers = await Promise.all(dataPromises);
      // Tri par abonnés pour définir le leader
      setAuthors(allUsers.sort((a, b) => (b.subscribers?.length || 0) - (a.subscribers?.length || 0)));
    } catch (e) { 
      toast.error("Erreur de synchronisation");
    } finally { 
      setLoading(false); 
    }
  }

  // --- LOGIQUE DE NOTIFICATION ---
  const sendNotification = async (targetEmail, notification) => {
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetEmail, notification })
      });
    } catch (e) { console.error("Erreur notification:", e); }
  };

  const handleSubscription = async (targetAuthor, isSubscribed) => {
    if (!currentUser) return toast.error("Action réservée aux membres");
    if (targetAuthor.email === currentUser.email) return;

    const type = isSubscribed ? "unsubscribe" : "subscribe";
    const loadingToast = toast.loading("Mise à jour...");

    try {
      const res = await fetch('/api/handle-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type, 
          targetEmail: targetAuthor.email, 
          subscriberEmail: currentUser.email,
          subscriberName: currentUser.penName || currentUser.name 
        })
      });

      if (!res.ok) throw new Error();

      // Envoi de la notification si c'est un nouvel abonnement
      if (!isSubscribed) {
        await sendNotification(targetAuthor.email, {
          type: "subscription",
          from: currentUser.penName || currentUser.name,
          date: new Date().toISOString(),
          text: "commence à vous suivre !"
        });
      }
      
      toast.success(isSubscribed ? "Désabonné" : "Nouvel abonnement !", { id: loadingToast });
      loadUsers();
    } catch (e) { 
      toast.error("Erreur réseau", { id: loadingToast }); 
    }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center py-40">
      <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Le cercle se réunit...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-12 animate-in fade-in duration-700">
      <header className="space-y-4">
        <div className="inline-flex p-3 bg-slate-900 text-teal-400 rounded-2xl">
          <UsersIcon size={24} />
        </div>
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic">Communauté</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {authors.map((a, index) => {
          const subscribersCount = a.subscribers?.length || 0;
          const isSubscribed = a.subscribers?.includes(currentUser?.email);
          const isMe = a.email === currentUser?.email;
          const isPartner = subscribersCount >= 250;
          const isNumberOne = index === 0 && subscribersCount > 0;
          const progress = Math.min((subscribersCount / 250) * 100, 100);

          return (
            <div key={index} className={`relative bg-white rounded-[3rem] p-8 border transition-all duration-500 shadow-xl shadow-slate-200/50 flex flex-col justify-between ${isNumberOne ? 'ring-4 ring-amber-100 border-amber-200' : 'border-slate-100'}`}>
              
              {isNumberOne && (
                <div className="absolute -top-4 left-8 bg-amber-400 text-slate-900 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg z-10">
                  <Crown size={12} fill="currentColor" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Plume du Mois</span>
                </div>
              )}

              <div className="flex justify-between items-start">
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 bg-slate-50 rounded-[2rem] overflow-hidden border-4 border-white shadow-md flex items-center justify-center text-3xl font-black text-teal-600 italic">
                    {a.profilePic ? <img src={a.profilePic} className="w-full h-full object-cover" alt="" /> : a.name?.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-black text-xl text-slate-900 italic">{a.penName || a.name}</h2>
                      {isPartner && <ShieldCheck size={18} className="text-teal-500" />}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <TrendingUp size={14} className="text-teal-500" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{subscribersCount} Abonnés</p>
                    </div>
                  </div>
                </div>

                {!isMe && (
                  <button
                    onClick={() => handleSubscription(a, isSubscribed)}
                    className={`p-4 rounded-2xl transition-all ${isSubscribed ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-teal-600'}`}
                  >
                    {isSubscribed ? <UserMinus size={20} /> : <UserPlus size={20} />}
                  </button>
                )}
              </div>

              <div className="mt-8 space-y-2">
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-1000 ${isPartner ? 'bg-amber-400' : 'bg-teal-500'}`} style={{ width: `${progress}%` }} />
                </div>
              </div>

              <Link 
                href={`/auteur/${encodeURIComponent(a.email)}`} 
                className="mt-6 flex items-center justify-center gap-3 w-full py-4 bg-slate-50 rounded-2xl text-[10px] font-black text-slate-500 hover:bg-slate-900 hover:text-white transition-all uppercase tracking-widest"
              >
                VOIR LE CATALOGUE <ArrowRight size={14} />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
