// components/account-management/SubscriptionSection.jsx
import React, { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import AppIcon from "@/components/AppIcon";

const SubscriptionSection = ({ subscriptionData, onSubscriptionUpdate }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [selectedSubscribers, setSelectedSubscribers] = useState([]);

  const [subscribers, setSubscribers] = useState(subscriptionData || []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const toggleSelectSubscriber = (id) => {
    setSelectedSubscribers((prev) =>
      prev.includes(id)
        ? prev.filter((subId) => subId !== id)
        : [...prev, id]
    );
  };

  const filteredSubscribers = subscribers
    .filter(
      (sub) =>
        sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "recent") return new Date(b.lastActivity) - new Date(a.lastActivity);
      if (sortBy === "oldest") return new Date(a.lastActivity) - new Date(b.lastActivity);
      return 0;
    });

  return (
    <div className="p-6 bg-blue-50 rounded-lg space-y-4">
      <h2 className="text-xl font-bold text-blue-700 mb-4">Abonnés</h2>

      {/* Recherche et tri */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <Input
          label="Rechercher"
          placeholder="Nom ou email"
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <select
          value={sortBy}
          onChange={handleSortChange}
          className="border rounded p-2"
        >
          <option value="recent">Plus récents</option>
          <option value="oldest">Plus anciens</option>
        </select>
      </div>

      {/* Liste des abonnés */}
      <div className="space-y-2">
        {filteredSubscribers.map((sub) => (
          <div
            key={sub.id}
            className="flex items-center justify-between p-2 bg-white rounded shadow-sm"
          >
            <div className="flex items-center gap-4">
              <img
                src={sub.avatar}
                alt={sub.name}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-semibold">{sub.name}</p>
                <p className="text-sm text-gray-600">{sub.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-sm">
                Abonné depuis: {new Date(sub.subscriptionDate).toLocaleDateString("fr-FR")}
              </p>
              <p className="text-sm">Vues totales: {sub.views}</p>
              <input
                type="checkbox"
                checked={selectedSubscribers.includes(sub.id)}
                onChange={() => toggleSelectSubscriber(sub.id)}
              />
            </div>
          </div>
        ))}
        {filteredSubscribers.length === 0 && (
          <p className="text-gray-500 text-sm">Aucun abonné trouvé.</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <Button
          variante="primary"
          onClick={() => onSubscriptionUpdate(selectedSubscribers)}
          disabled={selectedSubscribers.length === 0}
        >
          Appliquer aux abonnés sélectionnés
        </Button>
      </div>
    </div>
  );
};

export default SubscriptionSection;