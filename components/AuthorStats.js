// components/AuthorStats.js
import { useEffect, useState } from "react";
import { db } from "@/firebase/firebaseConfig";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

export default function AuthorStats({ authorId }){
  const [followers,setFollowers]=useState(0);
  const [views,setViews]=useState(0);

  useEffect(()=>{
    const fetch = async ()=>{
      try{
        const docRef = doc(db, "authors", authorId);
        const snap = await getDoc(docRef);
        if(snap.exists()){
          const data = snap.data();
          setFollowers(data.followers || 0);
        }
        // compute total views across texts
        const q = query(collection(db, "texts"), where("authorId","==",authorId));
        const snapT = await getDocs(q);
        let total = 0;
        snapT.forEach(d=> total += (d.data().views||0));
        setViews(total);
      }catch(e){ console.error(e); }
    };
    if(authorId) fetch();
  },[authorId]);

  const revenue = ((views/1000)*0.2);
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-white p-4 rounded shadow text-center">
        <h4 className="text-sm text-gray-500">Abonnés</h4>
        <div className="text-2xl font-bold">{followers}</div>
      </div>
      <div className="bg-white p-4 rounded shadow text-center">
        <h4 className="text-sm text-gray-500">Vues totales</h4>
        <div className="text-2xl font-bold">{views}</div>
      </div>
      <div className="bg-white p-4 rounded shadow text-center">
        <h4 className="text-sm text-gray-500">Gains estimés</h4>
        <div className="text-2xl font-bold">${revenue.toFixed(2)}</div>
      </div>
    </div>
  );
}
