"use client";
import { useEffect, useState } from "react";
import { Bell, Heart, MessageSquare, BookOpen, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotificationsPage() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Récupérer l'utilisateur depuis le localStorage
    const loggedUser = localStorage.getItem("lisible_user");
    if (loggedUser) {
      const userData = JSON.parse(loggedUser);
      setUser(userData);
      fetchNotifications(userData.email);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchNotifications = async (userEmail) => {
    try {
      // 2. Charger le fichier centralisé sur GitHub
      // On ajoute un timestamp (?t=...) pour éviter le cache navigateur
      const res = await fetch(`https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/notifications.json?t=${Date.now()}`);
      
      if (!res.ok) {
        setNotifications([]);
        return;
      }

      const allNotifs = await res.json();

      // 3. Filtrer : Public (targetEmail === null) OU personnel (targetEmail === mon email)
      const myNotifs = allNotifs.filter(n => 
        n.targetEmail === null || 
        (n.targetEmail && n.targetEmail.toLowerCase() === userEmail.toLowerCase())
      );

      setNotifications(myNotifs);
      
      // Marquer comme lu localement (optionnel : stocker le dernier ID vu)
      if (myNotifs.length > 0) {
        localStorage.setItem("last_notif_id", myNotifs[0].id);
      }
    } catch (error) {
      console.error("Erreur notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-20 p-10 bg-white rounded-[2.5rem] text-center shadow-xl border border-gray-100">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Bell size={32} />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-4">Connectez-vous</h1>
        <p className="text-gray-500 mb-8 text-sm leading-relaxed">
          Vous devez être connecté pour voir vos likes, commentaires et les nouvelles publications.
        </p>
        <Link href="/login" className="block w-full bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 transition-all">
          Se connecter
        </Link>
      </div>
    );
  }

  const getIcon = (type) => {
    switch (type) {
      case 'like': return <Heart size={18} className="text-red-500 fill-red-500" />;
      case 'comment': return <MessageSquare size={18} className="text-blue-500 fill-blue-500" />;
      case 'new_text': return <BookOpen size={18} className="text-green-500" />;
      default: return <Bell size={18} className="text-gray-400" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 min-h-screen">
      <header className="flex items-center justify-between mb-10">
        <Link href="/bibliotheque" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Activités</h1>
        <div className="w-10"></div> {/* Équilibre visuel */}
      </header>

      {notifications.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
          <p className="text-gray-400 font-medium">Aucune activité pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((n) => (
            <Link href={n.link || "#"} key={n.id} className="block group">
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-start gap-4">
                <div className="mt-1 p-2 bg-gray-50 rounded-xl group-hover:scale-110 transition-transform">
                  {getIcon(n.type)}
                </div>
                <div className="flex-grow">
                  <p className="text-gray-800 text-sm leading-relaxed font-medium">
                    {n.message}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <Clock size={12} />
                    {new Date(n.date).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
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
