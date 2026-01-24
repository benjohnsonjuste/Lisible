"use client";
import { useEffect, useState } from "react";
import { Mail, Users as UsersIcon, BookOpen, ChevronRight, UserPlus, UserMinus } from "lucide-react";
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
      const dataPromises = files.filter(f => f.name.endsWith('.json')).map(f => fetch(f.download_url).then(r => r.json()));
      const allUsers = await Promise.all(dataPromises);
      setAuthors(allUsers.sort((a, b) => (b.followers?.length || 0) - (a.followers?.length || 0)));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  const handleSubscription = async (targetAuthor, isSubscribed) => {
    if (!currentUser) return toast.error("Connectez-vous pour vous abonner");
    const type = isSubscribed ? "unfollow" : "follow";

    try {
      await fetch('/api/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, targetEmail: targetAuthor.email, followerEmail: currentUser.email })
      });
      
      // Notification si c'est un nouvel abonné
      if (type === "follow") {
        await fetch('/api/push-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'like', 
            message: `${currentUser.name} s'est abonné à vous !`,
            targetEmail: targetAuthor.email,
            link: '/users'
          })
        });
      }
      
      toast.success(isSubscribed ? "Désabonné" : "Abonnement réussi !");
      loadUsers(); // Recharger pour voir le compteur
    } catch (e) { toast.error("Erreur"); }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 min-h-screen">
      <header className="mb-12">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Communauté</h1>
        <p className="text-gray-500">Suivez vos auteurs préférés et aidez-les à débloquer la monétisation.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {authors.map((a, index) => {
          const isSubscribed = a.followers?.includes(currentUser?.email);
          const isMe = a.email === currentUser?.email;

          return (
            <div key={index} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black">
                    {a.name?.charAt(0)}
                  </div>
                  <div>
                    <h2 className="font-bold text-xl text-gray-900">{a.name}</h2>
                    <p className="text-blue-600 font-bold text-sm">{a.followers?.length || 0} abonnés</p>
                  </div>
                </div>

                {!isMe && (
                  <button
                    onClick={() => handleSubscription(a, isSubscribed)}
                    className={`p-3 rounded-2xl transition-all ${isSubscribed ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white shadow-lg shadow-blue-200'}`}
                  >
                    {isSubscribed ? <UserMinus size={20} /> : <UserPlus size={20} />}
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <Link href={`/bibliotheque?author=${encodeURIComponent(a.name)}`} className="flex-grow text-center py-3 bg-gray-50 rounded-2xl text-xs font-black text-gray-500 hover:bg-gray-100 transition-colors">
                  VOIR SES TEXTES
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
