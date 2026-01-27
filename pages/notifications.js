"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Heart, MessageSquare, BookOpen, Clock, ArrowLeft, Sparkles, UserPlus, Radio, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import Pusher from "pusher-js";

export default function NotificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState([]); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loggedUser = localStorage.getItem("lisible_user");
    const savedReadIds = JSON.parse(localStorage.getItem("read_notifications") || "[]");
    setReadIds(savedReadIds);
    
    let userData = null;
    if (loggedUser) {
      userData = JSON.parse(loggedUser);
      setUser(userData);
      fetchNotifications(userData.email);
    } else {
      setLoading(false);
    }

    // --- TEMPS RÉEL PUSHER ---
    const pusher = new Pusher('1da55287e2911ceb01dd', { cluster: 'us2' });
    const channel = pusher.subscribe('global-notifications');
    
    channel.bind('new-alert', (newNotif) => {
      const isForMe = newNotif.targetEmail === "all" || 
                     (userData && newNotif.targetEmail?.toLowerCase() === userData.email.toLowerCase());
      
      if (isForMe) {
        setNotifications(prev => [newNotif, ...prev]);
        toast.info("Nouvelle notification", { description: newNotif.message });
      }
    });

    return () => { pusher.unsubscribe('global-notifications'); };
  }, []);

  const fetchNotifications = async (userEmail) => {
    try {
      const res = await fetch(`https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/notifications.json?t=${Date.now()}`);
      if (!res.ok) return;
      const allNotifs = await res.json();
      
      const myNotifs = allNotifs.filter(n => 
        n.targetEmail === "all" || 
        (n.targetEmail && n.targetEmail.toLowerCase() === userEmail.toLowerCase())
      );
      
      setNotifications(myNotifs.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  // ... (Conservez votre fonction markAsRead et getIcon)

  // Rendu JSX identique au vôtre
  return ( /* Votre code JSX ici */ );
}
