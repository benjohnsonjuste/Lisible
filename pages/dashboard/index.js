import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebaseConfig";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  if (!user) {
    return <p>Chargement...</p>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Dashboard</h1>
      <p>Bienvenue {user.email}</p>
    </div>
  );
}