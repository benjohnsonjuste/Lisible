// pages/evenements.js
import EventClosed from "@/components/EventClosed";

export default function EvenementsPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-10">
          Nos Événements
        </h1>
        <EventClosed />
      </div>
    </div>
  );
}
