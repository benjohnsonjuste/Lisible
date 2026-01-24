"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // Ajout pour la navigation programmée
import { Bell, Heart, MessageSquare, BookOpen, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loggedUser = localStorage.getItem("lisible_user");
    
    if (loggedUser) {
      const userData = JSON.parse(loggedUser);
      setUser(userData);
      fetchNotifications(userData.email);
    } else {
      // Optionnel : rediriger automatiquement vers login après 2 secondes 
      // ou laisser l'écran de connexion actuel
      setLoading(false);
    }
  }, []);

  const fetchNotifications = async (userEmail) => {
    try {
      // Anti-cache strict pour GitHub Raw
      const res = await fetch(`https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/notifications.json?t=${new Date().getTime()}`);
      
      if (!res.ok) {
        setNotifications([]);
        return;
      }

      const allNotifs = await res.json();

      // Filtrage : Public ou Personnel
      const myNotifs = allNotifs.filter(n => 
        n.targetEmail === null || 
        (n.targetEmail && n.targetEmail.toLowerCase() === userEmail.toLowerCase())
      );

      setNotifications(myNotifs);
      
      // Mise à jour du "dernier vu" pour éteindre la cloche
      if (myNotifs.length > 0) {
        localStorage.setItem("last_notif_id", myNotifs[0].id.toString());
      }
    } catch (error) {
      console.error("Erreur notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-white">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-20 p-10 bg-white rounded-[2.5rem] text-center shadow-2xl shadow-blue-50 border border-gray-100 animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Bell size={40} />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-4">Espace Membre</h1>
        <p className="text-gray-500 mb-8 text-sm leading-relaxed">
          Connectez-vous pour ne rien manquer de vos interactions et des nouveautés de Lisible.
        </p>
        <Link href="/login" className="block w-full bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-200">
          Se connecter maintenant
        </Link>
      </div>
    );
  }

  const getIcon = (type) => {
    switch (type) {
      case 'like': return <Heart size={18} className="text-red-500 fill-red-500" />;
      case 'comment': return <MessageSquare size={18} className="text-blue-500 fill-blue-500" />;
      case 'new_text': return <BookOpen size={18} className="text-indigo-500" />;
      default: return <Bell size={18} className="text-gray-400" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 min-h-screen bg-white">
      <header className="flex items-center justify-between mb-12">
        <button onClick={() => router.back()} className="p-3 hover:bg-gray-50 rounded-2xl transition-all text-gray-400 border border-transparent hover:border-gray-100">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Flux d'activités</h1>
        <div className="w-12"></div>
      </header>

      {notifications.length === 0 ? (
        <div className="text-center py-24 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
          <p className="text-gray-400 font-bold italic tracking-wide">C'est un peu calme ici...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((n) => (
            <Link href={n.link || "#"} key={n.id} className="block group">
              <div className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 flex items-start gap-5">
                <div className="mt-1 p-3 bg-gray-50 rounded-2xl group-hover:bg-blue-50 transition-colors">
                  {getIcon(n.type)}
                </div>
                <div className="flex-grow">
                  <p className="text-gray-800 text-sm leading-relaxed font-semibold">
                    {n.message}
                  </p>
                  <div className="flex items-center gap-2 mt-3 text-[10px] font-black text-gray-300 uppercase tracking-widest group-hover:text-blue-400 transition-colors">
                    <Clock size={12} />
                    {new Date(n.date).toLocaleString('fr-FR', { 
                        day: 'numeric', 
                        month: 'short', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
