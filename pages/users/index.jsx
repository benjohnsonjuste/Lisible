"use client";
import { useEffect, useState } from "react";
import { Users as UsersIcon, UserPlus, UserMinus, Star, ShieldCheck } from "lucide-react";
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
      const res = await fetch("https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/users");
      const files = await res.json();
      const dataPromises = files
        .filter(f => f.name.endsWith('.json'))
        .map(f => fetch(f.download_url + `?t=${Date.now()}`).then(r => r.json()));
      
      const allUsers = await Promise.all(dataPromises);
      // Tri par nombre d'abonnés (subscribers)
      setAuthors(allUsers.sort((a, b) => (b.subscribers?.length || 0) - (a.subscribers?.length || 0)));
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  }

  const handleSubscription = async (targetAuthor, isSubscribed) => {
    if (!currentUser) return toast.error("Connectez-vous pour vous abonner");
    if (targetAuthor.email === currentUser.email) return;

    const type = isSubscribed ? "unsubscribe" : "subscribe";
    const loadingToast = toast.loading(isSubscribed ? "Désabonnement..." : "Abonnement...");

    try {
      const res = await fetch('/api/handle-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type, 
          targetEmail: targetAuthor.email, 
          subscriberEmail: currentUser.email,
          subscriberName: currentUser.name 
        })
      });

      if (!res.ok) throw new Error();
      
      toast.success(isSubscribed ? "Vous ne suivez plus cet auteur" : `Vous suivez désormais ${targetAuthor.name} !`, { id: loadingToast });
      loadUsers(); // Rafraîchir la liste
    } catch (e) { 
      toast.error("Erreur de connexion", { id: loadingToast }); 
    }
  };

  if (loading) return <div className="flex justify-center p-20 animate-pulse text-gray-400 font-bold">Chargement des auteurs...</div>;

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight italic">Communauté</h1>
        <p className="text-gray-500 font-medium">Soutenez vos auteurs préférés pour les aider à atteindre les 250 abonnés.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {authors.map((a, index) => {
          const subscribersCount = a.subscribers?.length || 0;
          const isSubscribed = a.subscribers?.includes(currentUser?.email);
          const isMe = a.email === currentUser?.email;
          const isPartner = subscribersCount >= 250;

          return (
            <div key={index} className="card-lisible group hover:scale-[1.02] transition-transform">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="w-16 h-16 bg-slate-100 rounded-[1.5rem] overflow-hidden border-2 border-white shadow-sm flex items-center justify-center text-2xl font-black text-teal-600">
                      {a.profilePic ? (
                        <img src={a.profilePic} alt="" className="w-full h-full object-cover" />
                      ) : (
                        a.name?.charAt(0)
                      )}
                    </div>
                    {isPartner && (
                      <div className="absolute -top-2 -right-2 bg-amber-400 text-white p-1 rounded-full shadow-sm border-2 border-white">
                        <Star size={14} fill="currentColor" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-black text-xl text-gray-900 leading-none">{a.penName || a.name}</h2>
                      {isPartner && <ShieldCheck size={18} className="text-teal-500" />}
                    </div>
                    <p className="text-teal-600 font-black text-xs uppercase tracking-widest mt-1">
                      {subscribersCount} {subscribersCount > 1 ? "Abonnés" : "Abonné"}
                    </p>
                  </div>
                </div>

                {!isMe && (
                  <button
                    onClick={() => handleSubscription(a, isSubscribed)}
                    className={`p-4 rounded-2xl transition-all active:scale-90 ${
                      isSubscribed 
                      ? 'bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500' 
                      : 'btn-lisible shadow-lg shadow-teal-100'
                    }`}
                  >
                    {isSubscribed ? <UserMinus size={22} /> : <UserPlus size={22} />}
                  </button>
                )}
              </div>

              <div className="flex gap-3 mt-4">
                <Link 
                  href={`/bibliotheque?author=${encodeURIComponent(a.name)}`} 
                  className="w-full py-4 bg-slate-50 rounded-2xl text-[10px] font-black text-slate-400 hover:bg-slate-100 hover:text-teal-600 transition-all text-center tracking-widest uppercase"
                >
                  Lire ses publications
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
