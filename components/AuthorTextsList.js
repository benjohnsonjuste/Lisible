import { useEffect, useState } from "react";
import { db } from "@/firebase/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import Link from "next/link";

export default function AuthorTextsList({ authorId }){
  const [texts,setTexts]=useState([]);
  useEffect(()=>{
    const fetch = async ()=>{
      const q = query(collection(db, "texts"), where("authorId","==",authorId));
      const snap = await getDocs(q);
      setTexts(snap.docs.map(d=>({ id:d.id, ...d.data() })));
    };
    if(authorId) fetch();
  },[authorId]);

  return (
    <div className="bg-white p-6 rounded shadow">
      <h3 className="font-bold mb-3">Mes textes</h3>
      <ul>
        {texts.map(t=>(
          <li key={t.id} className="flex justify-between border-b py-2">
            <Link href={`/bibliotheque/${t.id}`}><a className="text-blue-600">{t.title}</a></Link>
            <span>{t.views || 0} vues</span>
          </li>
        ))}
      </ul>
    </div>
  );
  }
