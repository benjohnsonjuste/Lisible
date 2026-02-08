// components/EventClosed.jsx
import Link from "next/link";

export default function EventClosed() {
  const events = [
    { id: 1, name: "Battle Poétique International" },
    { id: 2, name: "Foire Virtuelle Cheikh Anta Diop" },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-200/50 max-w-2xl mx-auto my-10">
      <h2 className="text-3xl font-black text-slate-900 mb-6 italic tracking-tight">
        Événements actuellement fermés
      </h2>

      <p className="text-slate-500 font-medium mb-8 leading-relaxed">
        Voici la liste des événements qui sont actuellement clôturés.<br />  
        Nous vous donnons rendez-vous pour leur prochaine édition !
      </p>

      {/* Liste des événements */}
      <ul className="w-full max-w-sm mb-10 space-y-3">
        {events.map((event) => (
          <li
            key={event.id}
            className="text-sm font-black uppercase tracking-widest text-slate-400 bg-slate-50 border border-slate-100 px-5 py-4 rounded-2xl"
          >
            {event.name}
          </li>
        ))}
      </ul>

      <p className="text-slate-500 font-medium mb-8">
        En attendant, découvrez de magnifiques textes dans notre{" "}
        <strong className="text-slate-900">Bibliothèque</strong>.
      </p>

      <Link
        href="/bibliotheque"
        className="bg-slate-950 text-white px-8 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-xl hover:bg-teal-600 transition-all active:scale-95"
      >
        Aller à la Bibliothèque
      </Link>
    </div>
  );
}
