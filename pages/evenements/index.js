import Link from "next/link";

export default function Evenements() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Événements</h1>
      <ul className="space-y-4">
        <li>
          <Link href="/evenements/foire-virtuelle" className="text-blue-600 underline">
            Foire Virtuelle Cheikh Anta Diop
          </Link>
        </li>
        <li>
          <Link href="/evenements/battle-poetique" className="text-blue-600 underline">
            Battle Poétique International
          </Link>
        </li>
      </ul>
    </div>
  );
    }
