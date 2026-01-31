import { useEffect, useState } from "react";
import Pusher from "pusher-js";
import { Bell, Coins, UserPlus } from "lucide-react";
import { toast } from "sonner";

export default function NotificationBell({ userEmail }) {
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    const pusher = new Pusher("1da55287e2911ceb01dd", { cluster: "us2" });
    const channel = pusher.subscribe("global-notifications");

    channel.bind("new-alert", (data) => {
      // On ne montre la notif que si elle est destinée à l'utilisateur ou à tous
      if (data.targetEmail === "all" || data.targetEmail === userEmail) {
        setNotifs((prev) => [data, ...prev]);
        
        // Alerte visuelle immédiate (Toast)
        toast(data.message, {
          icon: data.type === "li_received" ? <Coins className="text-amber-500"/> : <Bell />,
          description: data.amountLi ? `+${data.amountLi} Li ajoutés` : "Voir les détails"
        });
      }
    });

    return () => pusher.unsubscribe("global-notifications");
  }, [userEmail]);

  return (
    <div className="relative p-2 hover:bg-slate-100 rounded-full cursor-pointer">
      <Bell size={20} className="text-slate-600" />
      {notifs.length > 0 && (
        <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white">
          {notifs.length}
        </span>
      )}
    </div>
  );
}
