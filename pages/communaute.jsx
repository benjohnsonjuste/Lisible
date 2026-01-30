import { useEffect, useState } from "react";
import { 
  UserPlus, UserMinus, Users as UsersIcon, 
  ArrowRight, TrendingUp, Crown, Loader2, ShieldCheck 
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { toast } from "sonner";

export default function UsersPage() {
  const router = useRouter();
  const [authors, setAuthors] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialisation des données
  useEffect(() => {
    const loadData = async () => {
      const logged = localStorage.getItem("lisible_user");
      if (logged) setCurrentUser(JSON.parse(logged));
      await loadUsers();
    };

    if (router.isReady) {
      loadData();
    }
  }, [router.isReady]);

  async function loadUsers() {
    try {
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/users?t=${Date.now()}`);
      if (!res.ok) throw new Error();
      
      const files = await res.json();
      const dataPromises = files
        .filter(f => f.name.endsWith('.json'))
        .map(f => fetch(`${f.download_url}?t=${Date.now()}`).then(r => r.json()));
      
      const allUsers = await Promise.all(dataPromises);
      
      // Tri par nombre d'abonnés (décroissant)
      setAuthors(allUsers.sort((a, b) => (b.subscribers?.length || 0) - (a.subscribers?.length || 0)));
    } catch (e) { 
      toast.error("Erreur de synchronisation des membres");
    } finally { 
      setLoading(false); 
    }
  }

  const handleSubscription = async (targetAuthor, isSubscribed) => {
    if (!currentUser) return toast.error("Action réservée aux membres connectés");
    if (targetAuthor.email === currentUser.email) return;

    const loadingToast = toast.loading(isSubscribed ? "Désabonnement..." : "Abonnement...");
    try {
      const res = await fetch('/api/handle-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: isSubscribed ? "unsubscribe" : "subscribe", 
          targetEmail: targetAuthor.email, 
          subscriberEmail: currentUser.email,
          subscriberName: currentUser.penName || currentUser.name 
        })
      });

      if (!res.ok) throw new Error();

      if (!isSubscribed) {
        await fetch("/api/create-notif", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "subscription",
            message: `${currentUser.penName || currentUser.name} vient de s'abonner à vous !`,
            targetEmail: targetAuthor.email,
            link: `/auteur/${encodeURIComponent(currentUser.email)}`
          })
        });
      }
      
      toast.success(isSubscribed ? "Abonnement retiré" : "Vous suivez cet auteur !", { id: loadingToast });
      loadUsers();
    } catch (e) { 
      toast.error("Erreur lors de l'opération", { id: loadingToast }); 
    }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center py-40 gap-4">
      <Loader2 className="animate-spin text-teal-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Le cercle se réunit...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-12 animate-in fade-in duration-500">
      <header className="space-y-4">
        <div className="inline-flex p-4 bg-slate-900 text-teal-400 rounded-3xl shadow-xl shadow-slate-200">
          <UsersIcon size={28} />
        </div>
        <div>
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter italic">Communauté</h1>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Le cercle des plumes de Lisible</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {authors.map((a, index) => {
          const subscribersCount = a.subscribers?.length || 0;
          const isSubscribed = a.subscribers?.includes(currentUser?.email);
          const isMe = a.email === currentUser?.email;
          const isNumberOne = index === 0 && subscribersCount > 0;
          const isStaff = a.penName === "Lisible Support Team" || a.name === "Lisible Support Team";
          const progress = Math.min((subscribersCount / 250) * 100, 100);

          return (
            <div key={index} className={`relative bg-white rounded-[3.5rem] p-10 border transition-all duration-500 hover:shadow-2xl ${isNumberOne ? 'ring-4 ring-amber-100 border-amber-200' : 'border-slate-100 shadow-xl shadow-slate-100/50'}`}>
              
              {isNumberOne && (
                <div className="absolute -top-4 left-10 bg-amber-400 text-slate-900 px-5 py-2 rounded-2xl flex items-center gap-2 shadow-xl z-10 animate-bounce">
                  <Crown size={14} fill="currentColor" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Plume du Mois</span>
                </div>
              )}

              {isStaff && (
                <div className="absolute -top-4 left-10 bg-slate-900 text-teal-400 px-5 py-2 rounded-2xl flex items-center gap-2 shadow-xl z-10 animate-bounce">
                  <ShieldCheck size={14} fill="currentColor" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Staff Officiel</span>
                </div>
              )}

              <div className="flex justify-between items-start">
                <div className="flex items-center gap-6">
                  {/* CERCLE PARFAIT APPLIQUÉ ICI */}
                  <div className="w-24 h-24 bg-slate-50 rounded-full overflow-hidden border-4 border-white shadow-lg flex items-center justify-center text-4xl font-black text-teal-600 italic">
                    {a.profilePic ? (
                      <img src={a.profilePic} className="w-full h-full object-cover" alt="" />
                    ) : (
                      a.penName?.charAt(0) || a.name?.charAt(0)
                    )}
                  </div>
                  <div>
                    <h2 className="font-black text-2xl text-slate-900 italic tracking-tight">
                      {a.penName || a.name}
                    </h2>
                    <div className="flex items-center gap-2 mt-2">
                      <TrendingUp size={16} className="text-teal-500" />
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        {subscribersCount} {subscribersCount > 1 ? 'Abonnés' : 'Abonné'}
                      </p>
                    </div>
                  </div>
                </div>

                {!isMe && (
                  <button 
                    onClick={() => handleSubscription(a, isSubscribed)} 
                    className={`p-5 rounded-2xl transition-all active:scale-90 ${isSubscribed ? 'bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-500' : 'bg-slate-900 text-white hover:bg-teal-600 shadow-lg'}`}
                    title={isSubscribed ? "Se désabonner" : "S'abonner"}
                  >
                    {isSubscribed ? <UserMinus size={22} /> : <UserPlus size={22} />}
                  </button>
                )}
              </div>

              <div className="mt-10 space-y-2">
                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-300">
                  <span>Influence</span>
                  <span>{Math.floor(progress)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                  <div 
                    className={`h-full transition-all duration-1000 ${isNumberOne ? 'bg-amber-400' : isStaff ? 'bg-slate-900' : 'bg-teal-50'}`} 
                    style={{ width: `${progress}%` }} 
                  />
                </div>
              </div>

              <Link 
                href={`/auteur/${encodeURIComponent(a.email)}`} 
                className="mt-8 flex items-center justify-center gap-3 w-full py-5 bg-slate-50 rounded-[1.5rem] text-[10px] font-black text-slate-500 hover:bg-slate-900 hover:text-white transition-all uppercase tracking-[0.2em] group"
              >
                VOIR LE CATALOGUE 
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          );
        })}
      </div>

      <footer className="text-center py-10 border-t border-slate-50">
        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">Lisible • L'élite de la littérature moderne</p>
      </footer>
    </div>
  );
}
