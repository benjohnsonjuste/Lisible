import { useEffect, useState } from "react";
import { auth } from "@/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (!u) window.location.href = "/login";
      else setUser(u);
    });
  }, []);

  if (!user) return <p>Chargement...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Dashboard</h1>
      <p>Bienvenue {user.email}</p>
    </div>
  );
