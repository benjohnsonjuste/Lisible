import { auth } from "../../firebaseConfig";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    if (!auth.currentUser) router.push("/login");
  }, []);

  return (
    <div style={{ maxWidth: "900px", margin: "auto", padding: "40px" }}>
      <h1>Bienvenue dans votre dashboard</h1>
      <p>Vous pouvez gérer vos textes, voir vos stats et suivre vos abonnés.</p>
      <a href="/dashboard/new-post">➕ Publier un nouveau texte</a>
    </div>
  );
}