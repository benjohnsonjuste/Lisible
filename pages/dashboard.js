import { useEffect, useState } from "react";
import { auth } from "@/lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import AuthorStats from "@/components/AuthorStats";
import MonetizationLock from "@/components/MonetizationLock";
import PublishingForm from "@/components/PublishingForm";
import AuthorTextsList from "@/components/AuthorTextsList";
import { useRouter } from "next/router";

export default function Dashboard(){
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, (u)=>{
      if(!u) router.push("/login");
      else setUser(u);
    });
    return ()=> unsub();
  }, [router]);

  if(!user) return <p>Chargement...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Tableau de bord</h1>
      <AuthorStats authorId={user.uid} />
      <MonetizationLock followers={0} /> {/* optionally connect to AuthorStats */}
      <PublishingForm authorId={user.uid} />
      <AuthorTextsList authorId={user.uid} />
    </div>
  );
}
