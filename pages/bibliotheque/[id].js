import { useRouter } from "next/router";
import Link from "next/link";

const sample = {
  "1": { title:"Le Voyageur", author:"Jean Dupont", content:"Le vent soufflait fort..." },
  "2": { title:"L'Étoile Perdue", author:"Marie Claire", content:"Dans l'immensité..." }
};

export default function TextPage(){
  const router = useRouter();
  const { id } = router.query;
  const t = sample[id];
  if(!t) return <div>Texte non trouvé</div>;
  return (
    <div>
      <Link href="/bibliotheque"><a className="text-blue-600">← Retour</a></Link>
      <h1 className="text-2xl font-bold mt-4">{t.title}</h1>
      <p className="text-gray-500">par {t.author}</p>
      <div className="mt-4 whitespace-pre-line">{t.content}</div>
    </div>
  );
}
