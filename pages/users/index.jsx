"use client";
import { useEffect, useState } from "react";
import { UserPlus, UserMinus, Star, ShieldCheck, Users as UsersIcon, ArrowRight, TrendingUp } from "lucide-react";
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
      // Tri par popularité (nombre d'abonnés)
      setAuthors(allUsers.sort((a, b) => (b.subscribers?.length || 0) - (a.subscribers?.length || 0)));
    } catch (e) { 
      console.error(e); 
      toast.error("Erreur lors du chargement des auteurs");
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
      
      toast.success(isSubscribed ? `Désabonné de ${targetAuthor.penName || targetAuthor.name}` : `Vous suivez désormais ${targetAuthor.penName || targetAuthor.name} !`, { id: loadingToast });
      loadUsers(); // Rafraîchir la liste pour voir le nouveau compteur
    } catch (e) { 
      toast.error("Erreur de connexion au serveur", { id: loadingToast }); 
    }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center py-40 text-teal-600">
      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-current mb-4"></div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Rencontre des plumes...</p>
    </div>
  );

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex p-3 bg-teal-50 text-teal-600 rounded-2xl mb-2">
            <UsersIcon size={32} />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter italic">Communauté</h1>
          <p className="text-slate-500 font-medium max-w-md leading-relaxed">
            Découvrez les visages derrière les textes et aidez vos auteurs préférés à atteindre <span className="text-teal-600 font-bold">l'éligibilité aux revenus</span>.
          </p>
        </div>
      </header>

      {/* Liste des auteurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {authors.map((a, index) => {
          const subscribersCount = a.subscribers?.length || 0;
          const isSubscribed = a.subscribers?.includes(currentUser?.email);
          const isMe = a.email === currentUser?.email;
          const isPartner = subscribersCount >= 250;
          const progress = Math.min((subscribersCount / 250) * 100, 100);

          return (
            <div key={index} className="card-lisible bg-white border-none ring-1 ring-slate-100 shadow-xl shadow-slate-200/50 flex flex-col justify-between group transition-all hover:ring-teal-200">
              
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-5">
                  {/* Avatar Stylisé */}
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 bg-slate-50 rounded-[2rem] overflow-hidden border-4 border-white shadow-md flex items-center justify-center text-3xl font-black text-teal-600 italic">
                      {a.profilePic ? (
                        <img src={a.profilePic} alt="" className="w-full h-full object-cover" />
                      ) : (
                        a.name?.charAt(0)
                      )}
                    </div>
                    {isPartner && (
                      <div className="absolute -bottom-1 -right-1 bg-amber-400 text-white p-1.5 rounded-xl shadow-lg border-2 border-white animate-bounce">
                        <Star size={16} fill="currentColor" />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-black text-xl text-slate-900 tracking-tight italic">{a.penName || a.name}</h2>
                      {isPartner && <ShieldCheck size={18} className="text-teal-500" />}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <TrendingUp size={14} className="text-teal-500" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {subscribersCount} {subscribersCount > 1 ? "Abonnés" : "Abonné"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bouton d'action */}
                {!isMe && (
                  <button
                    onClick={() => handleSubscription(a, isSubscribed)}
                    className={`p-4 rounded-[1.5rem] transition-all active:scale-90 flex items-center gap-2 ${
                      isSubscribed 
                      ? 'bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-500' 
                      : 'bg-teal-50 text-teal-600 hover:bg-teal-600 hover:text-white shadow-sm'
                    }`}
                    title={isSubscribed ? "Se désabonner" : "S'abonner"}
                  >
                    {isSubscribed ? <UserMinus size={22} /> : <UserPlus size={22} />}
                  </button>
                )}
                {isMe && (
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">Vous</span>
                )}
              </div>

              {/* Barre de progression vers les 250 */}
              <div className="mt-8 space-y-2">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                  <span className="text-slate-400">Objectif Partenaire</span>
                  <span className={isPartner ? "text-teal-600" : "text-slate-400"}>{subscribersCount} / 250</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className={`h-full transition-all duration-1000 ${isPartner ? 'bg-amber-400' : 'bg-teal-500'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Lien vers publications */}
              <Link 
                href={`/bibliotheque?author=${encodeURIComponent(a.name)}`} 
                className="mt-6 flex items-center justify-center gap-3 w-full py-4 bg-slate-50 rounded-2xl text-[10px] font-black text-slate-500 hover:bg-slate-900 hover:text-white transition-all tracking-[0.2em] uppercase group"
              >
                VOIR SES ŒUVRES <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          );
        })}
      </div>

      <footer className="text-center pt-10">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
          Lisible • Réseau Littéraire Haïtien
        </p>
      </footer>
    </div>
  );
}
