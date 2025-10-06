import React from "react";

export default function NotificationsSettings({ user }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Notifications</h2>
      <label className="flex items-center space-x-2">
        <input type="checkbox" defaultChecked={user.preferences?.notifications?.comments} />
        <span>Commentaires sur vos textes</span>
      </label>
      <label className="flex items-center space-x-2">
        <input type="checkbox" defaultChecked={user.preferences?.notifications?.followers} />
        <span>Nouveaux abonnés</span>
      </label>
    </div>
  );
}
