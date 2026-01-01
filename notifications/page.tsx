"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface Notification {
  id: string
  message: string
  created_at: string
  user_id: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!session) return

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from<Notification>("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .eq("user_id", session.user?.id)

      if (error) console.error("Erreur notifications:", error.message)
      else if (data) setNotifications(data)
    }

    fetchNotifications()

    const subscription = supabase
      .channel("public:notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        (payload) => {
          if (payload.new.user_id === session.user?.id) {
            setNotifications((prev) => [payload.new as Notification, ...prev])
          }
        }
      )
      .subscribe()

    return () => supabase.removeChannel(subscription)
  }, [session])

  if (!session) return <p>Vous devez être connecté pour voir vos notifications.</p>

  return (
    <div>
      <h1>Notifications</h1>
      {notifications.length === 0 && <p>Aucune notification</p>}
      <ul>
        {notifications.map((notif) => (
          <li key={notif.id}>
            {notif.message} — <small>{new Date(notif.created_at).toLocaleString()}</small>
          </li>
        ))}
      </ul>
    </div>
  )
}