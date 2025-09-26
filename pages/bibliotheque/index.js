import Link from "next/link";

const sample = [
  { id:"1", title:"Le Voyageur", author:"Jean Dupont", excerpt:"Le vent soufflait..." },
  { id:"2", title:"L'Étoile Perdue", author:"Marie Claire", excerpt:"Dans l'immensité..." }
];

export default function Library(){
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Bibliothèque de textes</h1>
      <div className="grid md:grid-cols-2 gap-6">
        {sample.map(t=>(
          <div key={t.id} className="bg-white p-4 rounded shadow">
            <h3 className="text-xl font-semibold">{t.title}</h3>
            <p className="text-sm text-gray-500">par {t.author}</p>
            <p className="mt-2 text-gray-700">{t.excerpt}</p>
            <Link href={`/bibliotheque/${t.id}`}><a className="text-blue-600 mt-3 inline-block">Lire plus</a></Link>
          </div>
        ))}
      </div>
    </div>
  );
  }
